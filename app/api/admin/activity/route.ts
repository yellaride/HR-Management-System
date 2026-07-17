import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Employee } from "@/modals/Employee";
import { ActivityLog } from "@/modals/ActivityLog";

// Helper to translate database activityType values into frontend category types
const mapActivityTypeToFrontendType = (activityType: string): string => {
  if (!activityType) return "system";
  const upper = activityType.toUpperCase();
  if (upper.includes("CHECK_IN") || upper.includes("CHECK_OUT") || upper.includes("ATTENDANCE")) {
    return "attendance";
  }
  if (upper.includes("LEAVE_REQUEST") || upper.includes("LEAVE_APPROVED") || upper.includes("LEAVE_REJECTED") || upper.includes("LEAVE")) {
    return "leave";
  }
  if (upper.includes("BIRTHDAY")) {
    return "birthday";
  }
  if (upper.includes("PAYSLIP") || upper.includes("SALARY") || upper.includes("PAYROLL")) {
    return "payslip";
  }
  return "system";
};

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type") || "all";
    const searchQuery = searchParams.get("search") || "";

    // 1. Resolve user ID mappings if searching by name
    let matchingUserIds: string[] = [];
    if (searchQuery) {
      const matchingEmployees = await Employee.find({
        name: { $regex: searchQuery, $options: "i" }
      }).select("_id").lean();
      matchingUserIds = matchingEmployees.map((emp: any) => emp._id.toString());
    }

    // 2. Build Database Query mapping actual database attributes
    const dbQuery: Record<string, any> = {};

    if (typeFilter !== "all") {
      if (typeFilter === "attendance") {
        dbQuery.activityType = { $in: ["CHECK_IN", "CHECK_OUT", "ATTENDANCE"] };
      } else if (typeFilter === "leave") {
        dbQuery.activityType = { $regex: "LEAVE", $options: "i" };
      } else if (typeFilter === "payslip") {
        dbQuery.activityType = { $regex: "PAYSLIP", $options: "i" };
      } else if (typeFilter === "system") {
        dbQuery.activityType = { $nin: ["CHECK_IN", "CHECK_OUT", "ATTENDANCE", "LEAVE_REQUEST", "LEAVE_APPROVED"] };
      }
    }

    if (searchQuery) {
      dbQuery.$or = [
        { description: { $regex: searchQuery, $options: "i" } },
        { activityType: { $regex: searchQuery, $options: "i" } }
      ];
      if (matchingUserIds.length > 0) {
        dbQuery.$or.push({ userId: { $in: matchingUserIds } });
      }
    }

    const dbLogs = await ActivityLog.find(dbQuery)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // 3. Retrieve all employees to map activityLog.userId to employee name + designation
    const employees = await Employee.find({}).lean();

    const employeeIdToName = new Map<string, string>();
    const employeeIdToDesignation = new Map<string, string>();
    const authUserIdToName = new Map<string, string>();
    const authUserIdToDesignation = new Map<string, string>();

    employees.forEach((emp: any) => {
      const empId = emp._id?.toString();
      const authUserId = emp.userId?.toString();
      if (empId) {
        employeeIdToName.set(empId, emp.name);
        employeeIdToDesignation.set(empId, emp.designation);
      }
      if (authUserId) {
        authUserIdToName.set(authUserId, emp.name);
        authUserIdToDesignation.set(authUserId, emp.designation);
      }
    });

    // 4. Normalize logs so they have the proper structure the React frontend expects
    const logsToRender = (dbLogs || []).map((log: any) => {
      const rawUserId = log.userId;
      const userIdStr = rawUserId?.toString();

      const resolvedName =
        (userIdStr ? employeeIdToName.get(userIdStr) : undefined) ??
        (userIdStr ? authUserIdToName.get(userIdStr) : undefined) ??
        "Unknown User";

      const resolvedDesignation =
        (userIdStr ? employeeIdToDesignation.get(userIdStr) : undefined) ??
        (userIdStr ? authUserIdToDesignation.get(userIdStr) : undefined) ??
        "";

      return {
        _id: log._id.toString(),
        user: resolvedName,
        designation: resolvedDesignation,
        action: log.description || "Performed an action",
        type: mapActivityTypeToFrontendType(log.activityType),
        createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : new Date().toISOString(),
      };
    });

    // 5. Sort remaining database logs descending by creation date
    logsToRender.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ logs: logsToRender }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch activity logs:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}