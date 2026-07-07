import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Leave from "@/modals/LeaveRequest";
import LeaveBalance from "@/modals/LeaveBalance";

// Safe date string formatter to prevent runtime ISO conversion crashes
function formatDateString(value: any): string {
  if (!value) return "";
  try {
    const d = new Date(value);
    return d.toISOString().split("T")[0];
  } catch {
    return String(value).split("T")[0] || "";
  }
}

// GET: Fetches leave requests dynamically based on the user's role
export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const currentUser = session?.user as any;

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const role = String(currentUser.role || "EMPLOYEE").toUpperCase();
    const userId = currentUser.id;

    let leaves = [];
    if (role === "ADMIN") {
      // Administrators see all leaves in the system
      leaves = await Leave.find({}).sort({ createdAt: -1 }).lean();
    } else {
      // Employees see only their own leave requests
      leaves = await Leave.find({ userId: String(userId) }).sort({ createdAt: -1 }).lean();
    }

    const formatted = await Promise.all(
      leaves.map(async (leave: any) => {
        const balanceDoc = await LeaveBalance.findOne({ userId: leave.userId }).lean();
        
        // Cast to 'any' to bypass Mongoose's lack of index signature and satisfy TypeScript compiler
        const balance = balanceDoc as any; 

        const rawType = String(leave.type || "").toUpperCase();
        const rawStatus = String(leave.status || "PENDING").toUpperCase();

        let totalLeaves = 18;
        let usedLeaves = 0;
        let remainingLeaves = 18;

        const matchedKey = rawType.includes("ANNUAL") ? "ANNUAL" : rawType.includes("SICK") ? "SICK" : "CASUAL";
        
        // Safely access dynamic keys from the balance object
        if (balance && balance[matchedKey]) {
          totalLeaves = balance[matchedKey].allocated ?? 18;
          usedLeaves = balance[matchedKey].used ?? 0;
          remainingLeaves = Math.max(0, totalLeaves - usedLeaves);
        }

        const typeTitle = rawType === "ANNUAL" || rawType === "ANNUAL LEAVE" ? "Annual Leave" :
                          rawType === "SICK" || rawType === "SICK LEAVE" ? "Sick Leave" :
                          rawType === "CASUAL" || rawType === "CASUAL LEAVE" ? "Casual Leave" : leave.type;

        const statusTitle = rawStatus === "APPROVED" ? "Approved" :
                            rawStatus === "REJECTED" ? "Rejected" : "Pending";

        return {
          id: String(leave._id),
          userId: String(leave.userId || ""),
          employeeName: leave.employeeName || "Employee",
          role: leave.role || "Staff Member",
          department: leave.department || "Internal",
          type: typeTitle,
          typeUpper: matchedKey,
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
    console.error("GET leaves error:", error);
    return NextResponse.json({ error: "Failed to load leave records." }, { status: 500 });
  }
}

// PUT: Admin-only leave request approval or rejection decisions
export async function PUT(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const currentUser = session?.user as any;

    // Strict Guard: Deny modifications to anyone who is not an administrator
    if (!currentUser || String(currentUser.role).toUpperCase() !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { id, action } = await req.json();
    if (!id || !action) {
      return NextResponse.json({ error: "Missing required query parameters." }, { status: 400 });
    }

    const targetAction = String(action).toUpperCase();
    const leaveRequest = await Leave.findById(id);

    if (!leaveRequest) {
      return NextResponse.json({ error: "Leave request not found." }, { status: 404 });
    }

    if (targetAction === "APPROVE") {
      leaveRequest.status = "APPROVED";
      await leaveRequest.save();
    } else if (targetAction === "REJECT") {
      const currentStatus = String(leaveRequest.status).toUpperCase();
      const leaveType = String(leaveRequest.type).toUpperCase();

      // Only refund days if the leave request has not already been rejected
      if (currentStatus !== "REJECTED" && leaveType !== "UNPAID") {
        const balanceDoc = await LeaveBalance.findOne({ userId: leaveRequest.userId });
        const balance = balanceDoc as any; // Cast to 'any' to resolve TypeScript dynamic index issues
        
        const matchedKey = leaveType.includes("ANNUAL") ? "ANNUAL" : 
                           leaveType.includes("SICK") ? "SICK" : "CASUAL";

        if (balance && balance[matchedKey]) {
          const currentUsed = balance[matchedKey].used || 0;
          balance[matchedKey].used = Math.max(0, currentUsed - Number(leaveRequest.days || 0));
          balanceDoc.markModified(matchedKey);
          await balanceDoc.save();
        }
      }
      leaveRequest.status = "REJECTED";
      await leaveRequest.save();
    } else {
      return NextResponse.json({ error: "Invalid administrative action requested." }, { status: 400 });
    }

    return NextResponse.json({
      id: String(leaveRequest._id),
      status: leaveRequest.status === "APPROVED" ? "Approved" : "Rejected"
    });
  } catch (error) {
    console.error("PUT leaves error:", error);
    return NextResponse.json({ error: "Failed to update leave request status." }, { status: 500 });
  }
}