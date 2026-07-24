import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Attendance } from "@/modals/Attendance";
import { Employee } from "@/modals/Employee";
import { MonthlyAttendance } from "@/modals/MonthlyAttendance";
import CompanyDetails from "@/modals/CompanyDetails";
import { getAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TIMEZONE = "Asia/Karachi";

interface AttendanceSettings {
  shiftStart?: string;
  shiftEnd?: string;
  gracePeriod?: number;
  autoCheckOut?: boolean;
  autoCheckOutBuffer?: number;
}

/** Returns date formatted as "YYYY-MM-DD" in Asia/Karachi time */
function getKarachiDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Returns total minutes from midnight in Asia/Karachi time */
function getKarachiMinutes(date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);

  let hours = 0;
  let minutes = 0;
  for (const part of parts) {
    if (part.type === "hour") hours = parseInt(part.value, 10) % 24;
    if (part.type === "minute") minutes = parseInt(part.value, 10);
  }
  return hours * 60 + minutes;
}

/** Converts "HH:MM" string to minutes from midnight */
function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map((num) => parseInt(num, 10));
  return (h || 0) * 60 + (m || 0);
}

/** Fetches active settings or defaults */
async function getActiveSettings() {
  let settings = await CompanyDetails.findOne();
  if (!settings) {
    settings = await CompanyDetails.create({
      shiftStart: "09:00",
      shiftEnd: "17:00",
      gracePeriod: 15,
      checkInDisplayBefore: 30,
      checkOutDisplayAfter: 0,
      autoCheckOut: false,
      autoCheckOutBuffer: 30,
    });
  }
  return settings;
}

/** Computes daily shift status and working hours (capped at 8h max) */
function computeDailyShiftsAndHours(
  checkInDate: Date | null,
  checkOutDate: Date | null,
  settings: { shiftStart?: string; shiftEnd?: string; gracePeriod?: number }
) {
  if (!checkInDate) {
    return { status: "Absent" as const, workingHours: 0, formattedDuration: "" };
  }

  const gracePeriod = typeof settings.gracePeriod === "number" ? settings.gracePeriod : 15;
  const shiftStart = settings.shiftStart || "09:00";
  const shiftEnd = settings.shiftEnd || "17:00";

  const checkInMinutes = getKarachiMinutes(checkInDate);
  const shiftStartMin = timeToMinutes(shiftStart);
  const graceThresholdMinutes = shiftStartMin + gracePeriod;

  let status: "On Time" | "Late" | "Absent" = "On Time";
  if (checkInMinutes > graceThresholdMinutes) {
    status = "Late";
  }

  if (!checkOutDate) {
    return { status, workingHours: 0, formattedDuration: "" };
  }

  const shiftEndMin = timeToMinutes(shiftEnd);
  const checkOutMinutes = getKarachiMinutes(checkOutDate);

  let diffMinutes = 0;
  const isNightShift = shiftEndMin < shiftStartMin;

  if (!isNightShift) {
    const effectiveStartMinutes = Math.max(checkInMinutes, shiftStartMin);
    const effectiveEndMinutes = Math.min(checkOutMinutes, shiftEndMin);
    diffMinutes = Math.max(0, effectiveEndMinutes - effectiveStartMinutes);
  } else {
    const diffMs = checkOutDate.getTime() - checkInDate.getTime();
    diffMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
  }

  // Cap working hours to 8 hours maximum per day
  if (diffMinutes > 8 * 60) {
    diffMinutes = 8 * 60;
  }

  const decimalHours = Math.round((diffMinutes / 60) * 100) / 100;
  const hrs = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  const formattedDuration = `${hrs} hrs ${mins} mins`;

  return { status, workingHours: decimalHours, formattedDuration };
}

/** Recalculates monthly aggregate metrics */
async function syncMonthlyAttendanceAggregates(userId: string, year: number, month: number) {
  const monthStr = String(month).padStart(2, "0");
  const startDate = `${year}-${monthStr}-01`;
  const endDate = `${year}-${monthStr}-31`;

  const allMonthlyLogs = await Attendance.find({
    userId,
    date: { $gte: startDate, $lte: endDate },
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
      isLocked: false,
    },
    { upsert: true, new: true }
  );
}

/** On-demand trigger when page loads */
async function runAutoCheckOutIfNeeded(date: string, settings: AttendanceSettings) {
  if (!settings?.autoCheckOut) return;

  const todayStr = getKarachiDateString();
  if (date > todayStr) return;

  if (date === todayStr) {
    const currentLocalMinutes = getKarachiMinutes();
    const shiftEndMin = timeToMinutes(settings.shiftEnd || "17:00");
    const bufferMin = typeof settings.autoCheckOutBuffer === "number" 
      ? Math.min(30, Math.max(0, settings.autoCheckOutBuffer)) 
      : 30;
    
    if (currentLocalMinutes < (shiftEndMin + bufferMin)) {
      return;
    }
  }

  const pendingLogs = await Attendance.find({
    date,
    checkIn: { $exists: true, $ne: null },
    $or: [{ checkOut: { $exists: false } }, { checkOut: null }],
  }).lean();

  if (pendingLogs.length === 0) return;

  const [yearStr, monthStr] = date.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  for (const log of pendingLogs) {
    const monthlyLockCheck = await MonthlyAttendance.findOne({ userId: log.userId, year, month }).lean();
    if (monthlyLockCheck?.isLocked) continue;

    const checkoutISO = `${date}T${settings.shiftEnd || "17:00"}:00+05:00`;
    let checkOutDate = new Date(checkoutISO);

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
          status: calculations.status,
        },
      }
    );

    await syncMonthlyAttendanceAggregates(log.userId, year, month);
  }
}

export async function GET(request: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);

    const date = searchParams.get("date");
    const userId = searchParams.get("userId");
    const period = searchParams.get("period");

    const todayStr = getKarachiDateString();
    const [currentYear, currentMonth] = todayStr.split("-").map((n) => parseInt(n, 10));

    if (userId) {
      await getActiveSettings();

      const query: Record<string, unknown> = { userId };

      if (period === "this-month") {
        const monthStr = String(currentMonth).padStart(2, "0");
        query.date = { $gte: `${currentYear}-${monthStr}-01`, $lte: `${currentYear}-${monthStr}-31` };
      } else if (period === "last-month") {
        let lastMonth = currentMonth - 1;
        let lastYear = currentYear;
        if (lastMonth === 0) {
          lastMonth = 12;
          lastYear = currentYear - 1;
        }
        const lastMonthStr = String(lastMonth).padStart(2, "0");
        query.date = { $gte: `${lastYear}-${lastMonthStr}-01`, $lte: `${lastYear}-${lastMonthStr}-31` };
      }

      const logs = await Attendance.find(query).sort({ date: -1 }).lean();

      const totalDays = logs.length;
      const onTimeDays = logs.filter((l) => l.status === "On Time").length;
      const lateDays = logs.filter((l) => l.status === "Late").length;
      const absentDays = logs.filter((l) => l.status === "Absent").length;
      const totalHours = logs.reduce((sum, l) => sum + (l.workingHours || 0), 0);

      const presenceCount = onTimeDays + lateDays;
      const attendanceRate = totalDays > 0 ? Math.round((presenceCount / totalDays) * 100) : 0;

      const targetMonth =
        period === "this-month" ? currentMonth : period === "last-month" ? (currentMonth === 1 ? 12 : currentMonth - 1) : null;
      const targetYear = period === "last-month" && currentMonth === 1 ? currentYear - 1 : currentYear;

      let isLocked = false;
      if (targetMonth) {
        const lockObj = await MonthlyAttendance.findOne({ userId, year: targetYear, month: targetMonth }).lean();
        isLocked = lockObj ? lockObj.isLocked : false;
      }

      return NextResponse.json(
        {
          logs,
          isLocked,
          stats: {
            totalDays,
            onTimeDays,
            lateDays,
            absentDays,
            totalHours: Number(totalHours.toFixed(2)),
            attendanceRate,
          },
        },
        { status: 200 }
      );
    }

    if (!date) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
    }

    const parts = date.split("-");
    const year = parseInt(parts[0], 10) || currentYear;
    const month = parseInt(parts[1], 10) || currentMonth;

    const settings = await getActiveSettings();

    // Check and execute pending checkouts on page view as fallback
    await runAutoCheckOutIfNeeded(date, settings);

    const [employees, logs, monthlyRecords] = await Promise.all([
      Employee.find({ status: { $ne: "Inactive" } }).lean(),
      Attendance.find({ date }).lean(),
      MonthlyAttendance.find({ year, month }).lean(),
    ]);

    const shiftStart = settings?.shiftStart || "09:00";
    const shiftEnd = settings?.shiftEnd || "17:00";
    const shiftTimeLabel = `${shiftStart}-${shiftEnd}`;

    type LeanEmployeeDoc = Record<string, unknown> & { shiftTime?: string };
    const enrichedEmployees = ((employees || []) as LeanEmployeeDoc[]).map((e) => ({
      ...e,
      shiftTime: e?.shiftTime || shiftTimeLabel,
    }));

    return NextResponse.json(
      {
        employees: enrichedEmployees,
        logs,
        monthlyRecords,
        shiftTimeLabel,
        companySettings: settings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Attendance API GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    await dbConnect();
    const body = await request.json();

    const { userId, date, checkIn, checkOut, status } = body;

    if (!userId || !date) {
      return NextResponse.json({ error: "Missing required fields: userId and date" }, { status: 400 });
    }

    const todayStr = getKarachiDateString();
    if (date > todayStr) {
      return NextResponse.json({ error: "Cannot register attendance for future dates." }, { status: 400 });
    }

    const parts = date.split("-");
    const year = parseInt(parts[0], 10) || parseInt(todayStr.split("-")[0], 10);
    const month = parseInt(parts[1], 10) || parseInt(todayStr.split("-")[1], 10);

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

    const updatePayload: Record<string, unknown> = {
      userId,
      date,
      status: finalStatus,
    };

    const updateQuery: Record<string, unknown> = {};

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
  } catch (error) {
    console.error("Attendance API POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}