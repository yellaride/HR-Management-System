import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Attendance } from "@/modals/Attendance";
import { MonthlyAttendance } from "@/modals/MonthlyAttendance";
import { ActivityLog } from "@/modals/ActivityLog"; 
import CompanyDetails from "@/modals/CompanyDetails";

// Set your regional timezone
const TIMEZONE = "Asia/Karachi"; 

export const dynamic = "force-dynamic";

// Timezone-safe local time helper
function getLocalTimeComponents(date: Date) {
  const tzString = date.toLocaleString("en-US", { timeZone: TIMEZONE });
  const localDateObj = new Date(tzString);
  return {
    hours: localDateObj.getHours(),
    minutes: localDateObj.getMinutes(),
    day: localDateObj.getDay(), // 0 = Sunday, 1 = Monday...
    localDateObj
  };
}

// Convert "HH:mm" time format to total minutes from midnight
function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

// Get local date string in YYYY-MM-DD format
function getLocalDateString(date: Date = new Date()): string {
  const tzString = date.toLocaleString("en-US", { timeZone: TIMEZONE });
  const localDate = new Date(tzString);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Fetch DB Configurations with Fallbacks
async function getActiveSettings() {
  let settings = await CompanyDetails.findOne();
  if (!settings) {
    settings = {
      shiftStart: "09:00",
      shiftEnd: "17:00",
      gracePeriod: 15,
      checkInDisplayBefore: 30,
      checkOutDisplayAfter: 0,
      autoCheckOut: false,
      autoCheckOutTime: "18:00",
    };
  }
  return settings;
}

// Evaluates and processes automated check-out if threshold is met
async function processAutoCheckOutIfEligible(userId: string, todayDateStr: string, settings: any) {
  if (!settings.autoCheckOut) return null;

  const record = await Attendance.findOne({ userId, date: todayDateStr });
  if (!record || record.checkOut) return record; // No record or already checked out

  const now = new Date();
  const localNow = getLocalTimeComponents(now);
  const currentMins = localNow.hours * 60 + localNow.minutes;
  const autoCheckOutMins = timeToMinutes(settings.autoCheckOutTime || "18:00");

  // If local time is equal to or past the auto checkout time, execute check-out
  if (currentMins >= autoCheckOutMins) {
    const autoCheckOutDate = new Date();
    const [autoH, autoM] = (settings.autoCheckOutTime || "18:00").split(":").map(Number);
    autoCheckOutDate.setHours(autoH, autoM, 0, 0);

    const checkInTime = new Date(record.checkIn);
    const localCheckIn = getLocalTimeComponents(checkInTime);

    // Calculate dynamic shift bounds
    const checkInBoundStart = new Date(localCheckIn.localDateObj);
    const [sH, sM] = (settings.shiftStart || "09:00").split(":").map(Number);
    checkInBoundStart.setHours(sH, sM, 0, 0);

    const checkOutBoundEnd = new Date(autoCheckOutDate);
    const [eH, eM] = (settings.shiftEnd || "17:00").split(":").map(Number);
    checkOutBoundEnd.setHours(eH, eM, 0, 0);

    const checkInLocalTime = localCheckIn.localDateObj.getTime();
    const checkOutLocalTime = autoCheckOutDate.getTime();

    // Lock boundaries to ensure hours outside configuration parameters are excluded
    const effectiveCheckInTime = Math.max(checkInLocalTime, checkInBoundStart.getTime());
    const effectiveCheckOutTime = Math.min(checkOutLocalTime, checkOutBoundEnd.getTime());

    let diffMs = effectiveCheckOutTime - effectiveCheckInTime;
    if (diffMs < 0) diffMs = 0;

    let diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours > 8) diffHours = 8; // Cap daily working hours

    const decimalHours = Math.round(diffHours * 100) / 100;
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const formattedDuration = `${hours} hrs ${mins} mins`;

    record.checkOut = autoCheckOutDate;
    record.workingHours = decimalHours;
    record.formattedDuration = formattedDuration;
    record.status = "Absent"; // Auto check-out defaults status to Absent if shift end parameter was missed

    await record.save();

    const currentYear = localNow.localDateObj.getFullYear();
    const currentMonth = localNow.localDateObj.getMonth() + 1;

    // Increment total working hours progressively in the monthly record
    const updatedMonthlyRecord = await MonthlyAttendance.findOneAndUpdate(
      { userId, year: currentYear, month: currentMonth, isLocked: false },
      { 
        $inc: { totalWorkingHours: decimalHours }
      },
      { new: true }
    );

    if (updatedMonthlyRecord) {
      updatedMonthlyRecord.totalWorkingHours = Math.round(updatedMonthlyRecord.totalWorkingHours * 100) / 100;
      await updatedMonthlyRecord.save();
    }

    // Write system activity log entry
    await ActivityLog.create({
      userId,
      activityType: "CHECK_OUT",
      date: todayDateStr,
      timestamp: autoCheckOutDate,
      description: `System auto-resolved check-out at configured time: ${settings.autoCheckOutTime} (Duration: ${formattedDuration})`,
      metadata: {
        attendanceId: record._id,
        workingHours: decimalHours,
        status: "Absent",
        isAutoCheckedOut: true,
      },
    });

    return record;
  }

  return record;
}

export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getActiveSettings();
    const todayDateStr = getLocalDateString();
    const now = new Date();
    const local = getLocalTimeComponents(now);
    const currentYear = local.localDateObj.getFullYear();
    const currentMonth = local.localDateObj.getMonth() + 1;

    // Auto-lock older months when querying logs
    await MonthlyAttendance.updateMany(
      {
        userId,
        $or: [
          { year: { $lt: currentYear } },
          { year: currentYear, month: { $lt: currentMonth } }
        ],
        isLocked: false
      },
      { $set: { isLocked: true } }
    );

    // Apply auto-checkout verification before fetching record
    let todayRecord = await processAutoCheckOutIfEligible(userId, todayDateStr, settings);
    if (!todayRecord) {
      todayRecord = await Attendance.findOne({ userId, date: todayDateStr });
    }

    const history = await Attendance.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const monthlyRecord = await MonthlyAttendance.findOne({
      userId,
      year: currentYear,
      month: currentMonth
    }).lean();

    const monthlyStats = monthlyRecord
      ? {
          presentDays: monthlyRecord.presentDays ?? 0,
          absentDays: monthlyRecord.absentDays ?? 0,
          lateDays: (monthlyRecord as any).lateDays ?? 0,
          leaveDays: monthlyRecord.leaveDays ?? 0,
          onDutyDays: monthlyRecord.onDutyDays ?? 0,
          totalWorkingHours: monthlyRecord.totalWorkingHours ?? 0,
        }
      : null;

    return NextResponse.json({ todayRecord, history, monthlyRecord, monthlyStats, settings }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch attendance metrics", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body; 

    if (!action || (action !== "check-in" && action !== "check-out")) {
      return NextResponse.json({ error: "Invalid action type provided" }, { status: 400 });
    }

    const settings = await getActiveSettings();
    const now = new Date();
    const local = getLocalTimeComponents(now);
    const currentYear = local.localDateObj.getFullYear();
    const currentMonth = local.localDateObj.getMonth() + 1;

    // 1. Weekly Off Constraint
    if (local.day === 0) {
      return NextResponse.json(
        { error: "Weekly Off: Attendance actions are disabled on Sundays." },
        { status: 400 }
      );
    }

    const todayDateStr = getLocalDateString(now);

    // Apply auto-checkout checks before executing any action
    await processAutoCheckOutIfEligible(userId, todayDateStr, settings);

    // 2. Active Operational Window Check (Parsed dynamically from Mongoose Company Settings)
    const currentTimeMinutes = local.hours * 60 + local.minutes;
    const shiftStartMin = timeToMinutes(settings.shiftStart || "09:00");
    const shiftEndMin = timeToMinutes(settings.shiftEnd || "17:00");
    const checkInDisplayOffset = settings.checkInDisplayBefore || 30;
    const checkOutDisplayOffset = settings.checkOutDisplayAfter || 0;

    const minAllowedTime = shiftStartMin - checkInDisplayOffset; 
    const maxAllowedTime = shiftEndMin + checkOutDisplayOffset;

    if (currentTimeMinutes < minAllowedTime || currentTimeMinutes > maxAllowedTime) {
      return NextResponse.json(
        { error: `Attendance actions are restricted to your active shift parameters (${settings.shiftStart} to ${settings.shiftEnd}).` },
        { status: 400 }
      );
    }

    // 3. Lock System - Automatically lock historical records belonging to past months
    await MonthlyAttendance.updateMany(
      {
        userId,
        $or: [
          { year: { $lt: currentYear } },
          { year: currentYear, month: { $lt: currentMonth } }
        ],
        isLocked: false
      },
      { $set: { isLocked: true } }
    );

    // 4. Lock Check - Prevent operations if the current month is locked
    const currentMonthlyRecord = await MonthlyAttendance.findOne({
      userId,
      year: currentYear,
      month: currentMonth
    });

    if (currentMonthlyRecord?.isLocked) {
      return NextResponse.json(
        { error: "Your attendance record for this month has been locked and cannot be edited." },
        { status: 400 }
      );
    }

    if (action === "check-in") {
      const existingRecord = await Attendance.findOne({ userId, date: todayDateStr });
      if (existingRecord) {
        return NextResponse.json({ error: "Already checked in for today" }, { status: 400 });
      }

      // Late check-in condition: Current time is past (shiftStart + gracePeriod)
      let status: "On Time" | "Late" | "Absent" = "On Time";
      const graceThresholdMinutes = shiftStartMin + (settings.gracePeriod || 15);

      if (currentTimeMinutes > graceThresholdMinutes) {
        status = "Late";
      }

      const newRecord = await Attendance.create({
        userId,
        date: todayDateStr,
        checkIn: now,
        status,
      });

      // Update monthly record (add present days)
      await MonthlyAttendance.findOneAndUpdate(
        { userId, year: currentYear, month: currentMonth },
        { 
          $inc: { presentDays: 1 },
          $setOnInsert: { totalWorkingHours: 0, absentDays: 0, leaveDays: 0, onDutyDays: 0, isLocked: false }
        },
        { upsert: true, new: true }
      );

      // Log activity to unified log
      await ActivityLog.create({
        userId,
        activityType: "CHECK_IN",
        date: todayDateStr,
        timestamp: now,
        description: `Checked in (Status: ${status})`,
        metadata: {
          attendanceId: newRecord._id,
          status,
        },
      });

      return NextResponse.json(
        { message: "Check-in successful", record: newRecord },
        { status: 201 }
      );
    } 
    
    if (action === "check-out") {
      const existingRecord = await Attendance.findOne({ userId, date: todayDateStr });
      if (!existingRecord) {
        return NextResponse.json(
          { error: "You must check-in first before attempting to check-out" },
          { status: 400 }
        );
      }

      if (existingRecord.checkOut) {
        return NextResponse.json({ error: "Already checked out for today" }, { status: 400 });
      }

      let finalStatus = existingRecord.status;

      // Calculate Bounded Working Hours dynamically based on active shift settings
      const checkInTime = new Date(existingRecord.checkIn);
      const checkOutTime = now;

      const localCheckIn = getLocalTimeComponents(checkInTime);
      const localCheckOut = getLocalTimeComponents(checkOutTime);

      const checkInBoundStart = new Date(localCheckIn.localDateObj);
      const [sH, sM] = (settings.shiftStart || "09:00").split(":").map(Number);
      checkInBoundStart.setHours(sH, sM, 0, 0);

      const checkOutBoundEnd = new Date(localCheckOut.localDateObj);
      const [eH, eM] = (settings.shiftEnd || "17:00").split(":").map(Number);
      checkOutBoundEnd.setHours(eH, eM, 0, 0);

      const checkInLocalTime = localCheckIn.localDateObj.getTime();
      const checkOutLocalTime = localCheckOut.localDateObj.getTime();

      const effectiveCheckInTime = Math.max(checkInLocalTime, checkInBoundStart.getTime());
      const effectiveCheckOutTime = Math.min(checkOutLocalTime, checkOutBoundEnd.getTime());

      let diffMs = effectiveCheckOutTime - effectiveCheckInTime;
      if (diffMs < 0) diffMs = 0;

      let diffHours = diffMs / (1000 * 60 * 60);
      
      // Cap at 8 hours maximum on a daily basis
      if (diffHours > 8) {
        diffHours = 8;
        diffMs = 8 * 1000 * 60 * 60;
      }

      const decimalHours = Math.round(diffHours * 100) / 100;

      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      const formattedDuration = `${hours} hrs ${mins} mins`;

      existingRecord.checkOut = now;
      existingRecord.status = finalStatus;
      existingRecord.workingHours = decimalHours;
      existingRecord.formattedDuration = formattedDuration;

      await existingRecord.save();

      // Increment total working hours progressively in the monthly record
      const updatedMonthlyRecord = await MonthlyAttendance.findOneAndUpdate(
        { userId, year: currentYear, month: currentMonth, isLocked: false },
        { 
          $inc: { totalWorkingHours: decimalHours }
        },
        { new: true }
      );

      // Round working hours in database to avoid floating point precision issues
      if (updatedMonthlyRecord) {
        updatedMonthlyRecord.totalWorkingHours = Math.round(updatedMonthlyRecord.totalWorkingHours * 100) / 100;
        await updatedMonthlyRecord.save();
      }

      // Log activity to unified log
      await ActivityLog.create({
        userId,
        activityType: "CHECK_OUT",
        date: todayDateStr,
        timestamp: now,
        description: `Checked out. Duration: ${formattedDuration}`,
        metadata: {
          attendanceId: existingRecord._id,
          workingHours: decimalHours,
          status: finalStatus,
        },
      });

      return NextResponse.json(
        { message: "Check-out successful", record: existingRecord },
        { status: 200 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: "Attendance action execution failed", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}