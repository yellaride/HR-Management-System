import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Leave from "@/modals/LeaveRequest";
import LeaveBalance from "@/modals/LeaveBalance";
import LeavePolicy from "@/modals/LeavePolicy"; // Dynamic LeavePolicy Import
import { ActivityLog } from "@/modals/ActivityLog";

type TrackedLeaveType = "ANNUAL" | "SICK" | "CASUAL";

function formatDate(value: Date): string {
  try {
    return value.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

// Helper to fetch the dynamic global leaves policy configured by the admin
async function getActivePolicy() {
  let policy = await LeavePolicy.findOne({ key: "default" });
  if (!policy) {
    policy = await LeavePolicy.findOne(); // Fallback query to find any active configuration
  }
  if (policy) {
    return {
      ANNUAL: Number(policy.ANNUAL ?? 15),
      SICK: Number(policy.SICK ?? 8),
      CASUAL: Number(policy.CASUAL ?? 6),
    };
  }
  // Safe defaults if no policy document exists in the collection yet
  return {
    ANNUAL: 15,
    SICK: 8,
    CASUAL: 6,
  };
}

// GET: Fetches this employee's leave requests + leave balances
export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const currentUser = session?.user as any;

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    // Employees only (leave dashboard is for employee side)
    const role = String(currentUser.role || "EMPLOYEE");
    if (String(role).toUpperCase() !== "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden: Employee access required." }, { status: 403 });
    }

    const userId = String(currentUser.id || currentUser.userId || "");
    if (!userId) {
      return NextResponse.json({ error: "Missing employee id." }, { status: 400 });
    }

    const leaves = await Leave.find({ userId }).sort({ createdAt: -1 }).lean();

    const formattedLeaves = (leaves as Array<Record<string, any>>).map((leave) => ({
      id: String(leave._id),
      type: String(leave.type),
      startDate: formatDate(new Date(leave.startDate)),
      endDate: formatDate(new Date(leave.endDate)),
      days: Number(leave.days),
      reason: String(leave.reason || ""),
      status: String(leave.status),
    }));

    // Fetch active global leaves policy limits set by admin
    const policy = await getActivePolicy();

    let balanceDoc = await LeaveBalance.findOne({ userId });

    // If the employee doesn't have a balance record, dynamically initialize it using admin policies
    if (!balanceDoc) {
      balanceDoc = await LeaveBalance.create({
        userId,
        ANNUAL: { allocated: policy.ANNUAL, used: 0, remaining: policy.ANNUAL },
        SICK: { allocated: policy.SICK, used: 0, remaining: policy.SICK },
        CASUAL: { allocated: policy.CASUAL, used: 0, remaining: policy.CASUAL },
      });
    }

    // Map dynamic configurations ensuring no values are hardcoded
    const balances = {
      ANNUAL: {
        allocated: balanceDoc.ANNUAL?.allocated ?? policy.ANNUAL,
        used: balanceDoc.ANNUAL?.used ?? 0,
        remaining:
          balanceDoc.ANNUAL?.remaining ??
          Math.max(0, (balanceDoc.ANNUAL?.allocated ?? policy.ANNUAL) - (balanceDoc.ANNUAL?.used ?? 0)),
      },
      SICK: {
        allocated: balanceDoc.SICK?.allocated ?? policy.SICK,
        used: balanceDoc.SICK?.used ?? 0,
        remaining:
          balanceDoc.SICK?.remaining ??
          Math.max(0, (balanceDoc.SICK?.allocated ?? policy.SICK) - (balanceDoc.SICK?.used ?? 0)),
      },
      CASUAL: {
        allocated: balanceDoc.CASUAL?.allocated ?? policy.CASUAL,
        used: balanceDoc.CASUAL?.used ?? 0,
        remaining:
          balanceDoc.CASUAL?.remaining ??
          Math.max(0, (balanceDoc.CASUAL?.allocated ?? policy.CASUAL) - (balanceDoc.CASUAL?.used ?? 0)),
      },
    };

    return NextResponse.json({ leaves: formattedLeaves, balances });
  } catch (error) {
    console.error("Employee leaves GET error:", error);
    return NextResponse.json({ error: "Failed to retrieve your leave records." }, { status: 500 });
  }
}

// POST: Create a new leave request + deduct balance for tracked paid types
export async function POST(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const currentUser = session?.user as any;

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const role = String(currentUser.role || "EMPLOYEE");
    if (String(role).toUpperCase() !== "EMPLOYEE") {
      return NextResponse.json({ error: "Forbidden: Employee access required." }, { status: 403 });
    }

    const userId = String(currentUser.id || currentUser.userId || "");
    if (!userId) {
      return NextResponse.json({ error: "Missing employee id." }, { status: 400 });
    }

    const body = await req.json();
    const { type, startDate, endDate, reason } = body as {
      type: "ANNUAL" | "SICK" | "CASUAL";
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

    // Fetch current policy setup dynamically from database configuration
    const policy = await getActivePolicy();

    let balanceDoc = await LeaveBalance.findOne({ userId });
    
    // Automatically initialize database balances if missing to prevent "balance not found" error
    if (!balanceDoc) {
      balanceDoc = await LeaveBalance.create({
        userId,
        ANNUAL: { allocated: policy.ANNUAL, used: 0, remaining: policy.ANNUAL },
        SICK: { allocated: policy.SICK, used: 0, remaining: policy.SICK },
        CASUAL: { allocated: policy.CASUAL, used: 0, remaining: policy.CASUAL },
      });
    }

    const trackedType = String(type).toUpperCase() as TrackedLeaveType;
    const leaveTypeBalance = (balanceDoc as any)[trackedType];

    // Safely verify remaining metrics based on dynamic values
    const allocated = Number(leaveTypeBalance?.allocated ?? policy[trackedType]);
    const used = Number(leaveTypeBalance?.used ?? 0);
    const remaining = Math.max(0, allocated - used);

    if (remaining < days) {
      return NextResponse.json({ error: "Not enough leave balance for the selected type." }, { status: 400 });
    }

    // Deduct immediately for pending request
    balanceDoc[trackedType].used = Math.max(0, used + days);
    
    // Sync dynamic remaining values
    balanceDoc[trackedType].remaining = Math.max(0, allocated - balanceDoc[trackedType].used);

    balanceDoc.markModified(trackedType);
    await balanceDoc.save();

    const newRequest = await Leave.create({
      userId,
      employeeName: currentUser.name || "Employee",
      role: currentUser.role || "EMPLOYEE",
      department: currentUser.department || "Internal",
      type: trackedType,
      startDate: start,
      endDate: end,
      days,
      reason,
      status: "PENDING",
    });

    // Log the leave application as a user activity
    await ActivityLog.create({
      userId,
      activityType: "LEAVE_REQUEST",
      date: formatDate(new Date()),
      timestamp: new Date(),
      description: `Requested ${days} day(s) of ${trackedType} leave (${formatDate(start)} to ${formatDate(end)})`,
      metadata: {
        leaveId: newRequest._id,
        leaveType: trackedType,
        days,
        status: "PENDING",
      },
    });

    const updatedBalances = {
      ANNUAL: {
        allocated: balanceDoc.ANNUAL?.allocated ?? policy.ANNUAL,
        used: balanceDoc.ANNUAL?.used ?? 0,
        remaining: balanceDoc.ANNUAL?.remaining ?? policy.ANNUAL,
      },
      SICK: {
        allocated: balanceDoc.SICK?.allocated ?? policy.SICK,
        used: balanceDoc.SICK?.used ?? 0,
        remaining: balanceDoc.SICK?.remaining ?? policy.SICK,
      },
      CASUAL: {
        allocated: balanceDoc.CASUAL?.allocated ?? policy.CASUAL,
        used: balanceDoc.CASUAL?.used ?? 0,
        remaining: balanceDoc.CASUAL?.remaining ?? policy.CASUAL,
      },
    };

    return NextResponse.json({
      message: "Leave request submitted.",
      newRequest: { id: String(newRequest._id), days },
      updatedBalances,
    }, { status: 201 });
  } catch (error) {
    console.error("Employee leaves POST error:", error);
    return NextResponse.json({ error: "Failed to submit leave request." }, { status: 500 });
  }
}

// PUT: (Admin only) Approves or Rejects leave requests
export async function PUT(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const currentUser = session?.user as any;

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const body = await req.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json({ error: "Missing leave request ID or action." }, { status: 400 });
    }

    const leave = await Leave.findById(id);
    if (!leave) {
      return NextResponse.json({ error: "Leave request not found." }, { status: 404 });
    }

    const currentStatus = String(leave.status).toUpperCase();
    const targetAction = String(action).toUpperCase();

    if (targetAction === "APPROVE") {
      leave.status = "APPROVED";
      await leave.save();

      // Log leave approval activity
      await ActivityLog.create({
        userId: leave.userId,
        activityType: "LEAVE_APPROVED",
        date: formatDate(new Date()),
        timestamp: new Date(),
        description: `Leave request for ${leave.days} day(s) of ${leave.type} was Approved.`,
        metadata: {
          leaveId: leave._id,
          leaveType: String(leave.type),
          days: Number(leave.days),
          status: "APPROVED",
        },
      });

    } else if (targetAction === "REJECT") {
      // Refund the leave days only if it hasn't already been rejected and is a tracked paid type
      if (currentStatus !== "REJECTED" && leave.type !== "UNPAID") {
        const balanceDoc = await LeaveBalance.findOne({ userId: leave.userId });
        
        if (balanceDoc) {
          const type = String(leave.type).toUpperCase() as TrackedLeaveType;
          
          if (balanceDoc[type]) {
            // Restore the pre-deducted days to the employee's balance
            balanceDoc[type].used = Math.max(0, (balanceDoc[type].used || 0) - Number(leave.days));
            
            // Re-sync dynamic remaining values
            const allocated = Number(balanceDoc[type].allocated ?? 0);
            balanceDoc[type].remaining = Math.max(0, allocated - balanceDoc[type].used);

            balanceDoc.markModified(type);
            await balanceDoc.save();
          }
        }
      }
      leave.status = "REJECTED";
      await leave.save();

      // Log leave rejection activity
      await ActivityLog.create({
        userId: leave.userId,
        activityType: "LEAVE_REJECTED",
        date: formatDate(new Date()),
        timestamp: new Date(),
        description: `Leave request for ${leave.days} day(s) of ${leave.type} was Rejected.`,
        metadata: {
          leaveId: leave._id,
          leaveType: String(leave.type),
          days: Number(leave.days),
          status: "REJECTED",
        },
      });

    } else {
      return NextResponse.json({ error: "Invalid action selected." }, { status: 400 });
    }

    // Format the updated record to match what the frontend's local state needs
    const formattedResponse = {
      id: String(leave._id),
      employeeName: leave.employeeName || "Unknown Employee",
      role: leave.role || "",
      type: String(leave.type),
      startDate: formatDate(new Date(leave.startDate)),
      endDate: formatDate(new Date(leave.endDate)),
      days: Number(leave.days),
      reason: String(leave.reason || ""),
      status: String(leave.status),
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error("Admin leaves PUT error:", error);
    return NextResponse.json({ error: "Failed to update leave request." }, { status: 500 });
  }
}