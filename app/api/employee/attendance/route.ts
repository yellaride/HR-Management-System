import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Attendance } from "@/modals/Attendance";
import { ActivityLog } from "@/modals/ActivityLog"; // Integrated ActivityLog model

// Set your regional timezone
const TIMEZONE = "Asia/Karachi"; 

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

// Get local date string in YYYY-MM-DD format
function getLocalDateString(date: Date = new Date()): string {
  const tzString = date.toLocaleString("en-US", { timeZone: TIMEZONE });
  const localDate = new Date(tzString);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todayDateStr = getLocalDateString();

    const todayRecord = await Attendance.findOne({ userId, date: todayDateStr });

    const history = await Attendance.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return NextResponse.json({ todayRecord, history }, { status: 200 });
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

    const now = new Date();
    const local = getLocalTimeComponents(now);

    // 1. Sunday Check
    if (local.day === 0) {
      return NextResponse.json(
        { error: "Weekly Off: Attendance actions are disabled on Sundays." },
        { status: 400 }
      );
    }

    // 2. Active Operational Window Check (11:30 AM to 08:30 PM)
    const currentTimeMinutes = local.hours * 60 + local.minutes;
    const minAllowedTime = 11 * 60 + 30; // 11:30 AM
    const maxAllowedTime = 20 * 60 + 30; // 8:30 PM

    if (currentTimeMinutes < minAllowedTime || currentTimeMinutes > maxAllowedTime) {
      return NextResponse.json(
        { error: "Attendance actions are only allowed within the shift margin (11:30 AM to 08:30 PM)." },
        { status: 400 }
      );
    }

    const todayDateStr = getLocalDateString(now);

    if (action === "check-in") {
      const existingRecord = await Attendance.findOne({ userId, date: todayDateStr });
      if (existingRecord) {
        return NextResponse.json({ error: "Already checked in for today" }, { status: 400 });
      }

      // Late check-in condition (Checked in after 12:30 PM)
      let status: "On Time" | "Late" | "Absent" = "On Time";
      if (currentTimeMinutes > (12 * 60 + 30)) {
        status = "Late";
      }

      const newRecord = await Attendance.create({
        userId,
        date: todayDateStr,
        checkIn: now,
        status,
      });

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

      // Determine final status
      let finalStatus = existingRecord.status;
      if (currentTimeMinutes > (20 * 60 + 30)) {
        finalStatus = "Absent";
      }

      // Calculate Bounded Working Hours (Time before 11:30 AM and after 8:30 PM is omitted)
      const checkInTime = new Date(existingRecord.checkIn);
      const checkOutTime = now;

      const localCheckIn = getLocalTimeComponents(checkInTime);
      const localCheckOut = getLocalTimeComponents(checkOutTime);

      // Boundaries based on standard shift configuration (11:30 AM and 08:30 PM)
      const checkInBoundStart = new Date(localCheckIn.localDateObj);
      checkInBoundStart.setHours(11, 30, 0, 0);

      const checkOutBoundEnd = new Date(localCheckOut.localDateObj);
      checkOutBoundEnd.setHours(20, 30, 0, 0);

      const checkInLocalTime = localCheckIn.localDateObj.getTime();
      const checkOutLocalTime = localCheckOut.localDateObj.getTime();

      // Lock boundaries to ensure hours outside 11:30 - 20:30 are excluded
      const effectiveCheckInTime = Math.max(checkInLocalTime, checkInBoundStart.getTime());
      const effectiveCheckOutTime = Math.min(checkOutLocalTime, checkOutBoundEnd.getTime());

      let diffMs = effectiveCheckOutTime - effectiveCheckInTime;
      if (diffMs < 0) diffMs = 0;

      const diffHours = diffMs / (1000 * 60 * 60);
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