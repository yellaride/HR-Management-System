import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Leave from "@/modals/LeaveRequest";
import LeaveBalance from "@/modals/LeaveBalance";
import { Employee } from "@/modals/Employee";
import { ActivityLog } from "@/modals/ActivityLog";

type TrackedLeaveType = "ANNUAL" | "SICK" | "CASUAL";

type LeaveBalanceEntry = { allocated?: number; used?: number; remaining?: number };
type LeanLeaveBalance = Partial<Record<TrackedLeaveType, LeaveBalanceEntry>>;

// Shape of the lean Leave docs read by this route
interface LeanLeave {
  _id: unknown;
  userId?: string | mongoose.Types.ObjectId;
  type?: string;
  status?: string;
  startDate?: unknown;
  endDate?: unknown;
  days?: number;
  reason?: string;
  employeeName?: string;
  designation?: string;
}

// Shape of the lean Employee doc fields read by this route
interface LeanEmployeeInfo {
  name?: string;
  designation?: string;
  profilePhotoUrl?: string;
  profilePhotoURL?: string;
  profilePicture?: string;
  image?: string;
  picture?: string;
}

function formatDateString(value: unknown): string {
  if (!value) return "";
  try {
    const d = new Date(value as string | number | Date);
    if (isNaN(d.getTime())) {
      return String(value).split("T")[0] || "";
    }
    return d.toISOString().split("T")[0];
  } catch {
    return String(value).split("T")[0] || "";
  }
}

// GET: Fetches all leaves for the admin panel alongside real-time balance metrics
export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const currentUser = session?.user;

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const role = String(currentUser.role || "employee").toUpperCase();
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    // Support both lowercase and uppercase legacy status values
    const leaves = await Leave.find({ 
      status: { 
        $in: [
          "PENDING", "APPROVED", "REJECTED", 
          "pending", "approved", "rejected",
          "Pending", "Approved", "Rejected"
        ] 
      } 
    })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = await Promise.all(
      (leaves as unknown as LeanLeave[]).map(async (leave) => {
        // Safe ObjectId resolution to prevent casting crashes
        let employeeDoc: LeanEmployeeInfo | null = null;
        if (leave.userId && mongoose.Types.ObjectId.isValid(leave.userId)) {
          employeeDoc = await Employee.findOne({ userId: new mongoose.Types.ObjectId(leave.userId) }).lean() as LeanEmployeeInfo | null;
        } else {
          employeeDoc = await Employee.findOne({ userId: leave.userId }).lean() as LeanEmployeeInfo | null;
        }

        const balanceDoc = await LeaveBalance.findOne({ userId: leave.userId }).lean();
        const balance = balanceDoc as LeanLeaveBalance | null; 

        const rawType = String(leave.type || "").toUpperCase();
        const rawStatus = String(leave.status || "PENDING").toUpperCase();

        const isAnnual = rawType.includes("ANNUAL");
        const isSick = rawType.includes("SICK");
        const isCasual = rawType.includes("CASUAL");
        const isUnpaid = rawType.includes("UNPAID");

        let totalLeaves = 0;
        let usedLeaves = 0;
        let remainingLeaves = 0;

        let matchedKey: TrackedLeaveType | null = null;
        if (isAnnual) matchedKey = "ANNUAL";
        else if (isSick) matchedKey = "SICK";
        else if (isCasual) matchedKey = "CASUAL";

        // Query balances only if the leave is of a tracked paid type
        const trackedBalance = matchedKey && balance ? balance[matchedKey] : undefined;
        if (trackedBalance) {
          totalLeaves = Number(trackedBalance.allocated ?? 15);
          usedLeaves = Number(trackedBalance.used ?? 0);
          remainingLeaves = Math.max(0, totalLeaves - usedLeaves);
        }

        const typeTitle = isAnnual ? "Annual Leave" :
                          isSick ? "Sick Leave" :
                          isCasual ? "Casual Leave" :
                          isUnpaid ? "Unpaid Leave" : (leave.type || "Other Leave");

        const statusTitle = rawStatus === "APPROVED" ? "Approved" :
                            rawStatus === "REJECTED" ? "Rejected" : "Pending";

        const resolvedName = employeeDoc?.name || leave.employeeName || "Employee";
        const resolvedDesignation = employeeDoc?.designation || leave.designation || "Staff Member";
        const resolvedProfilePhotoUrl =
          employeeDoc?.profilePhotoUrl ||
          employeeDoc?.profilePhotoURL ||
          employeeDoc?.profilePicture ||
          employeeDoc?.image ||
          employeeDoc?.picture ||
          "";

        return {
          id: String(leave._id),
          userId: String(leave.userId || ""),
          employeeName: resolvedName,
         profilePhotoUrl: resolvedProfilePhotoUrl, 
         designation: resolvedDesignation,
          type: typeTitle,
          typeUpper: matchedKey || "UNPAID",
          startDate: formatDateString(leave.startDate),
          endDate: formatDateString(leave.endDate),
          days: Number(leave.days || 0),
          reason: leave.reason || "No reason provided",
          status: statusTitle,
          statusUpper: rawStatus,
          totalLeaves,
          usedLeaves,
          remainingLeaves,
        };
      })
    );

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET Admin leaves error:", error);
    return NextResponse.json({ error: "Failed to load leave records." }, { status: 500 });
  }
}

// PUT: Admin approval and rejection decisions (includes balance refund if rejected)
export async function PUT(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const currentUser = session?.user;

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const role = String(currentUser.role || "employee").toUpperCase();
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { id, action } = await req.json();
    if (!id || !action) {
      return NextResponse.json({ error: "Missing action requirements." }, { status: 400 });
    }

    const targetAction = String(action).toUpperCase();
    const leaveRequest = await Leave.findById(id);

    if (!leaveRequest) {
      return NextResponse.json({ error: "Leave request not found." }, { status: 404 });
    }

    const currentStatus = String(leaveRequest.status).toUpperCase();
    const leaveType = String(leaveRequest.type).toUpperCase();

    if (targetAction === "APPROVE") {
      leaveRequest.status = "APPROVED";
      await leaveRequest.save();

      await ActivityLog.create({
        userId: leaveRequest.userId,
        activityType: "LEAVE_APPROVED",
        date: formatDateString(new Date()),
        timestamp: new Date(),
        description: `Leave request for ${leaveRequest.days} day(s) of ${leaveRequest.type} was Approved.`,
      });

    } else if (targetAction === "REJECT") {
      // Prevents "UNPAID" leaves (or variations like "UNPAID LEAVE") from corrupting and refunding casual leaves
      if (currentStatus !== "REJECTED" && !leaveType.includes("UNPAID")) {
        const balanceDoc = await LeaveBalance.findOne({ userId: leaveRequest.userId });
        const balance = balanceDoc as LeanLeaveBalance | null; 
        
        const matchedKey = leaveType.includes("ANNUAL") ? "ANNUAL" : 
                           leaveType.includes("SICK") ? "SICK" : "CASUAL";

        const balanceEntry = balance ? balance[matchedKey] : undefined;
        if (balanceEntry) {
          const currentUsed = Number(balanceEntry.used || 0);
          balanceEntry.used = Math.max(0, currentUsed - Number(leaveRequest.days || 0));
          
          const allocated = Number(balanceEntry.allocated ?? 0);
          balanceEntry.remaining = Math.max(0, allocated - balanceEntry.used);

          balanceDoc.markModified(matchedKey);
          await balanceDoc.save();
        }
      }
      leaveRequest.status = "REJECTED";
      await leaveRequest.save();

      await ActivityLog.create({
        userId: leaveRequest.userId,
        activityType: "LEAVE_REJECTED",
        date: formatDateString(new Date()),
        timestamp: new Date(),
        description: `Leave request for ${leaveRequest.days} day(s) of ${leaveRequest.type} was Rejected.`,
      });
    } else {
      return NextResponse.json({ error: "Invalid admin action." }, { status: 400 });
    }

    return NextResponse.json({
      id: String(leaveRequest._id),
      status: leaveRequest.status === "APPROVED" ? "Approved" : "Rejected"
    });
  } catch (error) {
    console.error("PUT Admin leaves error:", error);
    return NextResponse.json({ error: "Failed to update leave request status." }, { status: 500 });
  }
}