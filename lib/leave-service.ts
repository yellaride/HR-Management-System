/**
 * Shared leave listing + decision logic used by both the admin panel
 * (/api/admin/leaves) and department heads (/api/head/leaves).
 */
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Leave from "@/modals/LeaveRequest";
import LeaveBalance from "@/modals/LeaveBalance";
import { Employee } from "@/modals/Employee";
import { ActivityLog } from "@/modals/ActivityLog";

type TrackedLeaveType = "ANNUAL" | "SICK" | "CASUAL";

type LeaveBalanceEntry = { allocated?: number; used?: number; remaining?: number };
type LeanLeaveBalance = Partial<Record<TrackedLeaveType, LeaveBalanceEntry>>;

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

interface LeanEmployeeInfo {
  name?: string;
  designation?: string;
  profilePhotoUrl?: string;
  profilePhotoURL?: string;
  profilePicture?: string;
  image?: string;
  picture?: string;
}

export interface FormattedLeave {
  id: string;
  userId: string;
  employeeName: string;
  profilePhotoUrl: string;
  designation: string;
  type: string;
  typeUpper: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  statusUpper: string;
  totalLeaves: number;
  usedLeaves: number;
  remainingLeaves: number;
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

/**
 * Lists leaves with employee info + live balance metrics.
 * Pass userIds to scope results (department-head view); omit for all (admin).
 */
export async function listFormattedLeaves(userIds?: string[]): Promise<FormattedLeave[]> {
  await dbConnect();

  const query: Record<string, unknown> = {
    // Support both lowercase and uppercase legacy status values
    status: {
      $in: [
        "PENDING", "APPROVED", "REJECTED",
        "pending", "approved", "rejected",
        "Pending", "Approved", "Rejected",
      ],
    },
  };

  if (userIds) {
    if (userIds.length === 0) return [];
    query.userId = { $in: userIds };
  }

  const leaves = await Leave.find(query).sort({ createdAt: -1 }).lean();

  return Promise.all(
    (leaves as unknown as LeanLeave[]).map(async (leave) => {
      // Safe ObjectId resolution to prevent casting crashes
      let employeeDoc: LeanEmployeeInfo | null = null;
      if (leave.userId && mongoose.Types.ObjectId.isValid(leave.userId)) {
        employeeDoc = (await Employee.findOne({
          userId: new mongoose.Types.ObjectId(leave.userId),
        }).lean()) as LeanEmployeeInfo | null;
      } else {
        employeeDoc = (await Employee.findOne({ userId: leave.userId }).lean()) as LeanEmployeeInfo | null;
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

      const trackedBalance = matchedKey && balance ? balance[matchedKey] : undefined;
      if (trackedBalance) {
        totalLeaves = Number(trackedBalance.allocated ?? 15);
        usedLeaves = Number(trackedBalance.used ?? 0);
        remainingLeaves = Math.max(0, totalLeaves - usedLeaves);
      }

      const typeTitle = isAnnual
        ? "Annual Leave"
        : isSick
          ? "Sick Leave"
          : isCasual
            ? "Casual Leave"
            : isUnpaid
              ? "Unpaid Leave"
              : leave.type || "Other Leave";

      const statusTitle =
        rawStatus === "APPROVED" ? "Approved" : rawStatus === "REJECTED" ? "Rejected" : "Pending";

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
}

export type LeaveDecisionResult =
  | { ok: true; id: string; status: "Approved" | "Rejected" }
  | { ok: false; status: number; error: string };

/**
 * Approves or rejects a leave request (includes balance refund on reject).
 * decidedByNote is appended to the activity log, e.g. "by department head Ali".
 */
export async function decideLeaveRequest(
  id: string,
  action: string,
  decidedByNote = ""
): Promise<LeaveDecisionResult> {
  await dbConnect();

  if (!id || !action) {
    return { ok: false, status: 400, error: "Missing action requirements." };
  }

  const targetAction = String(action).toUpperCase();
  const leaveRequest = await Leave.findById(id);

  if (!leaveRequest) {
    return { ok: false, status: 404, error: "Leave request not found." };
  }

  const currentStatus = String(leaveRequest.status).toUpperCase();
  const leaveType = String(leaveRequest.type).toUpperCase();
  const noteSuffix = decidedByNote ? ` ${decidedByNote}` : "";

  if (targetAction === "APPROVE") {
    leaveRequest.status = "APPROVED";
    await leaveRequest.save();

    await ActivityLog.create({
      userId: leaveRequest.userId,
      activityType: "LEAVE_APPROVED",
      date: formatDateString(new Date()),
      timestamp: new Date(),
      description: `Leave request for ${leaveRequest.days} day(s) of ${leaveRequest.type} was Approved${noteSuffix}.`,
    });
  } else if (targetAction === "REJECT") {
    // Prevents "UNPAID" leaves (or variations like "UNPAID LEAVE") from corrupting and refunding casual leaves
    if (currentStatus !== "REJECTED" && !leaveType.includes("UNPAID")) {
      const balanceDoc = await LeaveBalance.findOne({ userId: leaveRequest.userId });
      const balance = balanceDoc as LeanLeaveBalance | null;

      const matchedKey: TrackedLeaveType = leaveType.includes("ANNUAL")
        ? "ANNUAL"
        : leaveType.includes("SICK")
          ? "SICK"
          : "CASUAL";

      const balanceEntry = balance ? balance[matchedKey] : undefined;
      if (balanceEntry && balanceDoc) {
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
      description: `Leave request for ${leaveRequest.days} day(s) of ${leaveRequest.type} was Rejected${noteSuffix}.`,
    });
  } else {
    return { ok: false, status: 400, error: "Invalid action." };
  }

  return {
    ok: true,
    id: String(leaveRequest._id),
    status: leaveRequest.status === "APPROVED" ? "Approved" : "Rejected",
  };
}
