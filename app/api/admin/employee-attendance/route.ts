import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Attendance } from "@/modals/Attendance";
import { Employee } from "@/modals/Employee";
import { MonthlyAttendance } from "@/modals/MonthlyAttendance";
import CompanyDetails from "@/modals/CompanyDetails";

export const dynamic = "force-dynamic";

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

async function getActiveSettings() {
  let settings = await CompanyDetails.findOne();
  if (!settings) {
    settings = await CompanyDetails.create({
      shiftStart: "12:00",
      shiftEnd: "20:00",
      gracePeriod: 15,
      checkInDisplayBefore: 30,
      checkOutDisplayAfter: 0,
      autoCheckOut: false,
      autoCheckOutTime: "18:00"
    });
  }
  return settings;
}

function computeDailyShiftsAndHours(
  checkInDate: Date | null, 
  checkOutDate: Date | null, 
  settings: { shiftStart?: string; shiftEnd?: string; gracePeriod?: number }
) {
  if (!checkInDate) {
    return { status: "Absent" as const, workingHours: 0, formattedDuration: "" };
  }

  const timeZone = "Asia/Karachi";
  const gracePeriod = typeof settings.gracePeriod === "number" ? settings.gracePeriod : 15;
  const shiftStart = settings.shiftStart || "09:00";
  const shiftEnd = settings.shiftEnd || "17:00";

  const getMinutesInTimezone = (date: Date, tz: string) => {
    const tzString = date.toLocaleTimeString("en-US", {
      timeZone: tz,
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
    const [hours, minutes] = tzString.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const checkInMinutes = getMinutesInTimezone(checkInDate, timeZone);
  const shiftStartMin = timeToMinutes(shiftStart);
  const graceThresholdMinutes = shiftStartMin + gracePeriod;

  let status: "On Time" | "Late" | "Absent" = "On Time";
  if (checkInMinutes > graceThresholdMinutes) {
    status = "Late";
  }

  if (!checkOutDate) {
    return { status, workingHours: 0, formattedDuration: "" };
  }

  const checkOutMinutes = getMinutesInTimezone(checkOutDate, timeZone);
  const shiftEndMinutes = timeToMinutes(shiftEnd);

  const effectiveStartMinutes = Math.max(checkInMinutes, shiftStartMin);
  const effectiveEndMinutes = Math.min(checkOutMinutes, shiftEndMinutes);

  let diffMinutes = effectiveEndMinutes - effectiveStartMinutes;
  if (diffMinutes < 0) diffMinutes = 0;

  // Limit daily working hours to 8 hours max
  if (diffMinutes > 8 * 60) {
    diffMinutes = 8 * 60;
  }

  const decimalHours = Math.round((diffMinutes / 60) * 100) / 100;
  const hrs = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  const formattedDuration = `${hrs} hrs ${mins} mins`;

  return { status, workingHours: decimalHours, formattedDuration };
}

async function syncMonthlyAttendanceAggregates(userId: string, year: number, month: number) {
  const monthStr = String(month).padStart(2, "0");
  const datePattern = `^${year}-${monthStr}`;

  const allMonthlyLogs = await Attendance.find({
    userId,
    date: { $regex: datePattern }
  }).lean();

  let totalWorkingHours = 0;
  let presentDays = 0;
  let absentDays = 0;

  allMonthlyLogs.forEach((log) => {
    if (log.status === "On Time" || log.status === "Late") {
      presentDays += 1;
    } else if (log.status === "Absent") {
      absentDays += 1;
    }
    totalWorkingHours += log.workingHours || 0;
  });

  totalWorkingHours = Math.round(totalWorkingHours * 100) / 100;

  await MonthlyAttendance.findOneAndUpdate(
    { userId, year, month },
    {
      totalWorkingHours,
      presentDays,
      absentDays,
      isLocked: false 
    },
    { upsert: true, new: true }
  );
}

/**
 * Automatically checks out employees who have check-ins but are missing check-outs,
 * given that the autoCheckOut setting is enabled and the appropriate threshold has passed.
 */
async function runAutoCheckOutIfNeeded(date: string, settings: any) {
  if (!settings?.autoCheckOut) return;

  const serverTime = new Date();
  const localNow = new Date(serverTime.toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  
  const currentYear = localNow.getFullYear();
  const currentMonth = localNow.getMonth() + 1;
  const currentDay = localNow.getDate();
  const todayStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(currentDay).padStart(2, "0")}`;

  // Do not run operations on future days
  if (date > todayStr) return;

  // If checking today, verify whether Pakistan local time has reached the trigger threshold
  if (date === todayStr) {
    const currentLocalMinutes = localNow.getHours() * 60 + localNow.getMinutes();
    const autoCheckOutMinutes = timeToMinutes(settings.autoCheckOutTime || "18:00");
    if (currentLocalMinutes < autoCheckOutMinutes) {
      return; 
    }
  }

  // Find daily logs having a check-in but missing a check-out
  const pendingLogs = await Attendance.find({
    date,
    checkIn: { $exists: true, $ne: null },
    checkOut: { $exists: false }
  }).lean();

  if (pendingLogs.length === 0) return;

  const [yearStr, monthStr] = date.split("-");
  const year = parseInt(yearStr);
  const month = parseInt(monthStr);

  for (const log of pendingLogs) {
    // Skip operation if the month is finalized/locked
    const monthlyLockCheck = await MonthlyAttendance.findOne({ userId: log.userId, year, month }).lean();
    if (monthlyLockCheck?.isLocked) {
      continue;
    }

    // Safely resolve check-out timestamp matching shiftEnd in local PKT (+05:00)
    const checkoutISO = `${date}T${settings.shiftEnd || "17:00"}:00+05:00`;
    let checkOutDate = new Date(checkoutISO);

    // Guard against negative boundaries (in case checkout is chronologically before check-in)
    if (log.checkIn && checkOutDate.getTime() < new Date(log.checkIn).getTime()) {
      checkOutDate = new Date(log.checkIn);
    }

    const calculations = computeDailyShiftsAndHours(log.checkIn, checkOutDate, settings);

    await Attendance.updateOne(
      { _id: log._id },
      {
        $set: {
          checkOut: checkOutDate,
          workingHours: calculations.workingHours,
          formattedDuration: calculations.formattedDuration,
          status: calculations.status
        }
      }
    );

    await syncMonthlyAttendanceAggregates(log.userId, year, month);
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    const date = searchParams.get("date"); // YYYY-MM-DD
    const userId = searchParams.get("userId");
    const period = searchParams.get("period"); // "this-month" | "last-month" | "all"

    const serverTime = new Date();
    const localNow = new Date(serverTime.toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
    const currentYear = localNow.getFullYear();
    const currentMonth = localNow.getMonth() + 1; // 1-12

    // CASE A: Fetch History & Monthly aggregations for drilldown
    if (userId) {
      // Evaluate past logs and ensure historical runs are up to date before fetching
      const settings = await getActiveSettings();
      
      let query: any = { userId };

      if (period === "this-month") {
        const monthStr = String(currentMonth).padStart(2, "0");
        query.date = { $regex: `^${currentYear}-${monthStr}` };
      } else if (period === "last-month") {
        let lastMonth = currentMonth - 1;
        let lastYear = currentYear;
        if (lastMonth === 0) {
          lastMonth = 12;
          lastYear = currentYear - 1;
        }
        const lastMonthStr = String(lastMonth).padStart(2, "0");
        query.date = { $regex: `^${lastYear}-${lastMonthStr}` };
      }

      const logs = await Attendance.find(query).sort({ date: -1 }).lean();

      const totalDays = logs.length;
      const onTimeDays = logs.filter((l) => l.status === "On Time").length;
      const lateDays = logs.filter((l) => l.status === "Late").length;
      const absentDays = logs.filter((l) => l.status === "Absent").length;
      const totalHours = logs.reduce((sum, l) => sum + (l.workingHours || 0), 0);

      const presenceCount = onTimeDays + lateDays;
      const attendanceRate = totalDays > 0 ? Math.round((presenceCount / totalDays) * 100) : 0;

      const targetMonth = period === "this-month" ? currentMonth : period === "last-month" ? (currentMonth === 1 ? 12 : currentMonth - 1) : null;
      const targetYear = period === "last-month" && currentMonth === 1 ? currentYear - 1 : currentYear;

      let isLocked = false;
      if (targetMonth) {
        const lockObj = await MonthlyAttendance.findOne({ userId, year: targetYear, month: targetMonth }).lean();
        isLocked = lockObj ? lockObj.isLocked : false;
      }

      return NextResponse.json({
        logs,
        isLocked,
        stats: {
          totalDays,
          onTimeDays,
          lateDays,
          absentDays,
          totalHours: Number(totalHours.toFixed(2)),
          attendanceRate,
        }
      }, { status: 200 });
    }

    // CASE B: Standard Daily Timesheets Load
    if (!date) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
    }

    const parts = date.split("-");
    const year = parseInt(parts[0]) || currentYear;
    const month = parseInt(parts[1]) || currentMonth;

    const settings = await getActiveSettings();
    
    // Evaluate if auto check-outs are needed on this day prior to loading the data payload
    await runAutoCheckOutIfNeeded(date, settings);

    const [employees, logs, monthlyRecords] = await Promise.all([
      Employee.find({ status: { $ne: "Inactive" } }).lean(),
      Attendance.find({ date }).lean(),
      MonthlyAttendance.find({ year, month }).lean(),
    ]);

    const shiftStart = settings?.shiftStart || "12:00";
    const shiftEnd = settings?.shiftEnd || "20:00";
    const shiftTimeLabel = `${shiftStart}-${shiftEnd}`;

    const enrichedEmployees = (employees || []).map((e: any) => ({
      ...e,
      shiftTime: e?.shiftTime || shiftTimeLabel,
    }));

    return NextResponse.json({ 
      employees: enrichedEmployees, 
      logs, 
      monthlyRecords, 
      shiftTimeLabel,
      companySettings: settings
    }, { status: 200 });

  } catch (error: any) {
    console.error("Attendance API GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    const { userId, date, checkIn, checkOut, status } = body;

    if (!userId || !date) {
      return NextResponse.json({ error: "Missing required fields: userId and date" }, { status: 400 });
    }

    const serverTime = new Date();
    const localNow = new Date(serverTime.toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
    const todayStr = localNow.toISOString().slice(0, 10);
    if (date > todayStr) {
      return NextResponse.json({ error: "Cannot register attendance for future dates." }, { status: 400 });
    }

    const parts = date.split("-");
    const year = parseInt(parts[0]) || localNow.getFullYear();
    const month = parseInt(parts[1]) || (localNow.getMonth() + 1);

    const monthlyLockCheck = await MonthlyAttendance.findOne({ userId, year, month }).lean();
    if (monthlyLockCheck?.isLocked) {
      return NextResponse.json(
        { error: "Changes blocked: This month's attendance logs are finalized and locked." },
        { status: 400 }
      );
    }

    const settings = await getActiveSettings();
    const checkInDate = checkIn ? new Date(checkIn) : null;
    const checkOutDate = checkOut ? new Date(checkOut) : null;

    const calculations = computeDailyShiftsAndHours(checkInDate, checkOutDate, settings);
    const finalStatus = status ? status : calculations.status;

    const updatePayload: any = {
      userId,
      date,
      status: finalStatus,
    };

    const updateQuery: any = {};

    if (finalStatus === "Absent") {
      updatePayload.workingHours = 0;
      updatePayload.formattedDuration = "";
      updateQuery.$set = updatePayload;
      updateQuery.$unset = { checkIn: "", checkOut: "" };
    } else {
      if (checkInDate) {
        updatePayload.checkIn = checkInDate;
      }
      if (checkInDate && checkOutDate) {
        updatePayload.checkOut = checkOutDate;
        updatePayload.workingHours = calculations.workingHours;
        updatePayload.formattedDuration = calculations.formattedDuration;
        updateQuery.$set = updatePayload;
      } else {
        updateQuery.$set = updatePayload;
        updateQuery.$unset = { checkOut: "", workingHours: "", formattedDuration: "" };
      }
    }

    const updatedRecord = await Attendance.findOneAndUpdate(
      { userId, date },
      updateQuery,
      { new: true, upsert: true, runValidators: true }
    ).lean();

    await syncMonthlyAttendanceAggregates(userId, year, month);

    return NextResponse.json({ success: true, record: updatedRecord }, { status: 200 });

  } catch (error: any) {
    console.error("Attendance API POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}