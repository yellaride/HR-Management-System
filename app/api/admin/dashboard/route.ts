// app/api/admin/dashboard/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Employee } from "@/modals/Employee";
import mongoose from "mongoose";
import { getAdminUser } from "@/lib/auth";

export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    await connectDB();

    const activeEmployeesFilter = { status: { $ne: "Inactive" } };

    // 1. Fetch total active employees
    const totalEmployees = await Employee.countDocuments(activeEmployeesFilter);

    // 2. Fetch distinct active departments count
    const departments = await Employee.distinct("department", activeEmployeesFilter);
    const totalDepartments = Array.isArray(departments) ? departments.filter(Boolean).length : 0;

    // 3. Fetch count of pending leave requests dynamically from database
    let pendingLeaves = 0; 
    try {
      const LeaveModel = mongoose.models.Leave || mongoose.models.LeaveRequest || mongoose.models.Leaves;
      
      if (LeaveModel) {
        pendingLeaves = await LeaveModel.countDocuments({
          status: { $regex: /^pending$/i } 
        });
      } else {
        const db = mongoose.connection.db;
        if (db) {
          const collections = await db.listCollections().toArray();
          const leaveColl = collections.find(c => c.name.toLowerCase().includes("leave"));
          if (leaveColl) {
            pendingLeaves = await db.collection(leaveColl.name).countDocuments({
              status: { $regex: /^pending$/i }
            });
          }
        }
      }
    } catch (e) {
      console.warn("Leave count dynamic retrieval failed. Fallback applied.", e);
    }

    // 4. Fetch and calculate Today's Attendance percentage dynamically
    let todayAttendancePercent = 0;
    let presentToday = 0;

    const TIMEZONE = "Asia/Karachi";
    const getLocalDateString = (date: Date = new Date()): string => {
      const tzString = date.toLocaleString("en-US", { timeZone: TIMEZONE });
      const localDate = new Date(tzString);
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, "0");
      const day = String(localDate.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    try {
      const AttendanceModel = mongoose.models.Attendance || mongoose.models.Attendances;
      const todayDateStr = getLocalDateString();
      const presentStatuses = ["On Time", "Late"];

      let presentTodayCount = 0;

      if (AttendanceModel) {
        presentTodayCount = await AttendanceModel.countDocuments({
          date: todayDateStr,
          status: { $in: presentStatuses },
        });
      } else {
        const db = mongoose.connection.db;
        if (db) {
          const collections = await db.listCollections().toArray();
          const attColl = collections.find((c) => c.name.toLowerCase().includes("attendance"));
          if (attColl) {
            presentTodayCount = await db.collection(attColl.name).countDocuments({
              date: todayDateStr,
              status: { $in: presentStatuses },
            });
          }
        }
      }

      if (totalEmployees > 0) {
        presentToday = presentTodayCount;
        todayAttendancePercent = Math.min(
          100,
          Math.round((presentTodayCount / totalEmployees) * 100)
        );
      }
    } catch (e) {
      console.warn("Attendance model dynamic query failed. Fallback applied.", e);
    }

    // 5. Fetch Today's Birthday Celebrants dynamically (Asia/Karachi)
    let todayBirthdays: unknown[] = [];
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: TIMEZONE,
        month: "numeric",
        day: "numeric",
      });
      const parts = formatter.formatToParts(now);
      const targetMonth = parseInt(parts.find((p) => p.type === "month")?.value || "0");
      const targetDay = parseInt(parts.find((p) => p.type === "day")?.value || "0");

      todayBirthdays = await Employee.find({
        status: "Active",
        dateOfBirth: { $ne: null },
        $expr: {
          $and: [
            { $eq: [{ $month: "$dateOfBirth" }, targetMonth] },
            { $eq: [{ $dayOfMonth: "$dateOfBirth" }, targetDay] }
          ]
        }
      })
      .select("name department designation profilePhotoUrl")
      .lean();
    } catch (e) {
      console.warn("Failed to retrieve today's birthdays for dashboard stats:", e);
    }

    return NextResponse.json(
      {
        totalEmployees,
        totalDepartments,
        pendingLeaves,
        todayAttendancePercent,
        presentToday,
        todayBirthdays // Return birthday arrays to Admin side
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