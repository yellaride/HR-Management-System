import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { Attendance } from "@/modals/Attendance";
import { Employee } from "@/modals/Employee";

// Helper function to format decimal hours into "X hrs Y mins"
function calculateDuration(checkIn: Date, checkOut: Date) {
  const diffMs = checkOut.getTime() - checkIn.getTime();
  if (diffMs <= 0) return { workingHours: 0, formattedDuration: "" };

  const decimalHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return {
    workingHours: decimalHours,
    formattedDuration: `${hrs} hrs ${mins} mins`,
  };
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    const date = searchParams.get("date"); // YYYY-MM-DD
    const userId = searchParams.get("userId");
    const period = searchParams.get("period"); // "this-month" | "last-month" | "all"

    // CASE A: Fetch Drilldown History & Aggregates for an Employee
    if (userId) {
      let query: any = { userId };
      const currentYear = 2026;

      if (period === "this-month") {
        query.date = { $regex: `^${currentYear}-07` }; // July 2026
      } else if (period === "last-month") {
        query.date = { $regex: `^${currentYear}-06` }; // June 2026
      }

      const logs = await Attendance.find(query).sort({ date: -1 }).lean();

      // Calculate aggregates based on status: On Time, Late, Absent
      const totalDays = logs.length;
      const onTimeDays = logs.filter((l) => l.status === "On Time").length;
      const lateDays = logs.filter((l) => l.status === "Late").length;
      const absentDays = logs.filter((l) => l.status === "Absent").length;
      const totalHours = logs.reduce((sum, l) => sum + (l.workingHours || 0), 0);

      const presenceCount = onTimeDays + lateDays;
      const attendanceRate = totalDays > 0 ? Math.round((presenceCount / totalDays) * 100) : 0;

      return NextResponse.json({
        logs,
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

    // Fetch active employees and logs for the specific date
    const employees = await Employee.find({ status: "Active" }).lean();
    const logs = await Attendance.find({ date }).lean();

    return NextResponse.json({ employees, logs }, { status: 200 });

  } catch (error: any) {
    console.error("Attendance API GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
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

    const checkInDate = checkIn ? new Date(checkIn) : null;
    const checkOutDate = checkOut ? new Date(checkOut) : null;

    let workingHours = 0;
    let formattedDuration = "";

    const updatePayload: any = {
      userId,
      date,
      status: status || "On Time",
    };

    if (checkInDate) {
      updatePayload.checkIn = checkInDate;
    }

    const updateQuery: any = { $set: updatePayload };

    if (checkInDate && checkOutDate) {
      const duration = calculateDuration(checkInDate, checkOutDate);
      updatePayload.checkOut = checkOutDate;
      updatePayload.workingHours = duration.workingHours;
      updatePayload.formattedDuration = duration.formattedDuration;
    } else {
      // If no check-out date is provided (the employee is "On Duty"),
      // unset checkOut fields in the DB to represent the active check-in state.
      updateQuery.$unset = { checkOut: "", workingHours: "", formattedDuration: "" };
    }

    // Upsert record using atomic unique index (userId + date)
    const updatedRecord = await Attendance.findOneAndUpdate(
      { userId, date },
      updateQuery,
      { new: true, upsert: true, runValidators: true }
    ).lean();

    return NextResponse.json({ success: true, record: updatedRecord }, { status: 200 });

  } catch (error: any) {
    console.error("Attendance API POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}