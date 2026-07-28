// app/api/admin/dashboard/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Employee } from "@/modals/Employee";
import { Attendance } from "@/modals/Attendance";
import Leave from "@/modals/LeaveRequest";
import { getAdminUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const TIMEZONE = "Asia/Karachi";

function getKarachiDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    await connectDB();

    const activeEmployeesFilter = { status: { $ne: "Inactive" } };
    const todayDateStr = getKarachiDateString();
    const [, monthStr, dayStr] = todayDateStr.split("-");
    const targetMonth = parseInt(monthStr, 10);
    const targetDay = parseInt(dayStr, 10);

    // All dashboard metrics fetched in parallel — one round-trip of latency
    const [totalEmployees, departments, pendingLeaves, presentTodayCount, todayBirthdays] =
      await Promise.all([
        Employee.countDocuments(activeEmployeesFilter),
        Employee.distinct("department", activeEmployeesFilter),
        Leave.countDocuments({ status: { $regex: /^pending$/i } }),
        Attendance.countDocuments({
          date: todayDateStr,
          status: { $in: ["On Time", "Late"] },
        }),
        Employee.find({
          status: "Active",
          dateOfBirth: { $ne: null },
          $expr: {
            $and: [
              { $eq: [{ $month: "$dateOfBirth" }, targetMonth] },
              { $eq: [{ $dayOfMonth: "$dateOfBirth" }, targetDay] },
            ],
          },
        })
          .select("name department designation profilePhotoUrl")
          .lean(),
      ]);

    const totalDepartments = Array.isArray(departments)
      ? departments.filter(Boolean).length
      : 0;

    const todayAttendancePercent =
      totalEmployees > 0
        ? Math.min(100, Math.round((presentTodayCount / totalEmployees) * 100))
        : 0;

    return NextResponse.json(
      {
        totalEmployees,
        totalDepartments,
        pendingLeaves,
        todayAttendancePercent,
        presentToday: totalEmployees > 0 ? presentTodayCount : 0,
        todayBirthdays,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { error: message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
