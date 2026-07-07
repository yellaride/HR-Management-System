import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Employee } from "@/modals/Employee";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectDB();

    const activeEmployeesFilter = { status: { $ne: "Inactive" } };

    // 1. Fetch total active employees
    const totalEmployees = await Employee.countDocuments(activeEmployeesFilter);

    // 2. Fetch distinct active departments count
    const departments = await Employee.distinct("department", activeEmployeesFilter);
    const totalDepartments = Array.isArray(departments) ? departments.filter(Boolean).length : 0;

    // 3. Fetch count of pending leave requests dynamically from database
    let pendingLeaves = 0; // Standard fallback initialized to 0
    try {
      // Safely check registered mongoose models or locate matching schema
      const LeaveModel = mongoose.models.Leave || mongoose.models.LeaveRequest || mongoose.models.Leaves;
      
      if (LeaveModel) {
        pendingLeaves = await LeaveModel.countDocuments({
          status: { $regex: /^pending$/i } // Case-insensitive match for "Pending"
        });
      } else {
        // Dynamic native MongoDB collection query fallback to bypass MissingSchemaError
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

    // Match the schema used in modals/Attendance.ts:
    // - date stored as YYYY-MM-DD string
    // - status stored as "On Time" | "Late" | "Absent"
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

      // “Present” = On Time OR Late
      const presentStatuses = ["On Time", "Late"];

      let presentTodayCount = 0;

      if (AttendanceModel) {
        presentTodayCount = await AttendanceModel.countDocuments({
          date: todayDateStr,
          status: { $in: presentStatuses },
        });
      } else {
        // Dynamic Mongo collection fallback
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


    return NextResponse.json(
      {
        totalEmployees,
        totalDepartments,
        pendingLeaves,
        todayAttendancePercent,
        presentToday,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to fetch dashboard stats:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}