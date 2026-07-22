import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Leave from "@/modals/LeaveRequest";
import LeaveBalance from "@/modals/LeaveBalance";
import LeavePolicy from "@/modals/LeavePolicy"; 
import { Employee } from "@/modals/Employee";
import { ActivityLog } from "@/modals/ActivityLog";

type TrackedLeaveType = "ANNUAL" | "SICK" | "CASUAL";

// Session user fields read by this route (userId is a legacy fallback key)
interface SessionUserInfo {
  id?: string;
  userId?: string;
  role?: string;
  name?: string | null;
}

// Shape of the lean Leave docs read by this route
interface LeanEmployeeLeave {
  _id: unknown;
  type?: unknown;
  startDate: string | Date;
  endDate: string | Date;
  days?: unknown;
  reason?: unknown;
  status?: unknown;
}

function formatDate(value: Date): string {
  try {
    return value.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

async function getActivePolicy() {
  let policy = await LeavePolicy.findOne({ key: "default" });
  if (!policy) {
    policy = await LeavePolicy.findOne(); 
  }
  if (policy) {
    return {
      ANNUAL: Number(policy.ANNUAL ?? 15),
      SICK: Number(policy.SICK ?? 8),
      CASUAL: Number(policy.CASUAL ?? 6),
    };
  }
  return { ANNUAL: 15, SICK: 8, CASUAL: 6 };
}

// GET: Fetches employee's leaves and initialized balances
export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const currentUser = session?.user as SessionUserInfo | undefined;

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const role = String(currentUser.role || "employee").toUpperCase();
    if (role !== "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden: Employee access required." }, { status: 403 });
    }

    const userId = String(currentUser.id || currentUser.userId || "");
    if (!userId) {
      return NextResponse.json({ error: "Missing employee identification." }, { status: 400 });
    }

    const leaves = await Leave.find({ userId }).sort({ createdAt: -1 }).lean();

    const formattedLeaves = (leaves as unknown as LeanEmployeeLeave[]).map((leave) => ({
      id: String(leave._id),
      type: String(leave.type),
      startDate: formatDate(new Date(leave.startDate)),
      endDate: formatDate(new Date(leave.endDate)),
      days: Number(leave.days),
      reason: String(leave.reason || ""),
      status: String(leave.status),
    }));

    const policy = await getActivePolicy();
    let balanceDoc = await LeaveBalance.findOne({ userId });

    if (!balanceDoc) {
      balanceDoc = await LeaveBalance.create({
        userId,
        ANNUAL: { allocated: policy.ANNUAL, used: 0, remaining: policy.ANNUAL },
        SICK: { allocated: policy.SICK, used: 0, remaining: policy.SICK },
        CASUAL: { allocated: policy.CASUAL, used: 0, remaining: policy.CASUAL },
      });
    }

    const balances = {
      ANNUAL: {
        allocated: balanceDoc.ANNUAL?.allocated ?? policy.ANNUAL,
        used: balanceDoc.ANNUAL?.used ?? 0,
        remaining: balanceDoc.ANNUAL?.remaining ?? Math.max(0, (balanceDoc.ANNUAL?.allocated ?? policy.ANNUAL) - (balanceDoc.ANNUAL?.used ?? 0)),
      },
      SICK: {
        allocated: balanceDoc.SICK?.allocated ?? policy.SICK,
        used: balanceDoc.SICK?.used ?? 0,
        remaining: balanceDoc.SICK?.remaining ?? Math.max(0, (balanceDoc.SICK?.allocated ?? policy.SICK) - (balanceDoc.SICK?.used ?? 0)),
      },
      CASUAL: {
        allocated: balanceDoc.CASUAL?.allocated ?? policy.CASUAL,
        used: balanceDoc.CASUAL?.used ?? 0,
        remaining: balanceDoc.CASUAL?.remaining ?? Math.max(0, (balanceDoc.CASUAL?.allocated ?? policy.CASUAL) - (balanceDoc.CASUAL?.used ?? 0)),
      },
    };

    return NextResponse.json({ leaves: formattedLeaves, balances });
  } catch (error) {
    console.error("Employee leaves GET error:", error);
    return NextResponse.json({ error: "Failed to retrieve records." }, { status: 500 });
  }
}

// POST: Handles balance check, immediate balance deduction, and request registration
export async function POST(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const currentUser = session?.user as SessionUserInfo | undefined;

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const role = String(currentUser.role || "employee").toUpperCase();
    if (role !== "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden: Employee access required." }, { status: 403 });
    }

    const userId = String(currentUser.id || currentUser.userId || "");
    if (!userId) {
      return NextResponse.json({ error: "Missing employee identification." }, { status: 400 });
    }

    const body = await req.json();
    const { type, startDate, endDate, reason } = body as {
      type: "ANNUAL" | "SICK" | "CASUAL" | "UNPAID";
      startDate: string;
      endDate: string;
      reason: string;
    };

    if (!type || !startDate || !endDate || !reason) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
    }

    const msPerDay = 24 * 60 * 60 * 1000;
    const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / msPerDay) + 1);

    const rawType = String(type).toUpperCase();
    const isTracked = ["ANNUAL", "SICK", "CASUAL"].includes(rawType);

    // Fetch the employee's current name and designation details to attach to the Leave model
    const employeeDoc = await Employee.findOne({ userId }).lean() as { name?: string; designation?: string } | null;
    const resolvedName = employeeDoc?.name || currentUser.name || "Employee";
    const resolvedDesignation = employeeDoc?.designation || "Staff Member";

    if (isTracked) {
      const policy = await getActivePolicy();
      const trackedType = rawType as TrackedLeaveType;
      let balanceDoc = await LeaveBalance.findOne({ userId });

      if (!balanceDoc) {
        balanceDoc = await LeaveBalance.create({
          userId,
          ANNUAL: { allocated: policy.ANNUAL, used: 0, remaining: policy.ANNUAL },
          SICK: { allocated: policy.SICK, used: 0, remaining: policy.SICK },
          CASUAL: { allocated: policy.CASUAL, used: 0, remaining: policy.CASUAL },
        });
      }

      const leaveTypeBalance = (balanceDoc as Partial<Record<TrackedLeaveType, { allocated?: number; used?: number }>>)[trackedType];
      const allocated = Number(leaveTypeBalance?.allocated ?? policy[trackedType]);
      const used = Number(leaveTypeBalance?.used ?? 0);
      const remaining = Math.max(0, allocated - used);

      if (remaining < days) {
        return NextResponse.json({ error: `Insufficient leave balance for ${trackedType}.` }, { status: 400 });
      }

      // Deduct immediately on pending request
      balanceDoc[trackedType].used = Math.max(0, used + days);
      balanceDoc[trackedType].remaining = Math.max(0, allocated - balanceDoc[trackedType].used);

      balanceDoc.markModified(trackedType);
      await balanceDoc.save();
    }

    const newRequest = await Leave.create({
      userId,
      employeeName: resolvedName,
      designation: resolvedDesignation,
      type: rawType,
      startDate: start,
      endDate: end,
      days,
      reason,
      status: "PENDING",
    });

    await ActivityLog.create({
      userId,
      activityType: "LEAVE_REQUEST",
      date: formatDate(new Date()),
      timestamp: new Date(),
      description: `Requested ${days} day(s) of ${rawType} leave (${formatDate(start)} to ${formatDate(end)})`,
      metadata: { leaveId: newRequest._id, leaveType: rawType, days, status: "PENDING" },
    });

    return NextResponse.json({
      message: "Leave request submitted.",
      newRequest: { id: String(newRequest._id), days },
    }, { status: 201 });
  } catch (error) {
    console.error("Employee leaves POST error:", error);
    return NextResponse.json({ error: "Failed to submit leave request." }, { status: 500 });
  }
}