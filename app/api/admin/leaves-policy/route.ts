import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import EmployeeLeavePolicy from "@/modals/LeavePolicy";
import LeaveBalance from "@/modals/LeaveBalance";
import { Employee } from "@/modals/Employee"; // Named export
import User from "@/modals/User"; // Default export

// Define TypeScript interface for Mongoose Lean user document
interface IUserPopulated {
  _id: any;
  email?: string;
}

// GET: Fetch ONLY active employees with their custom policy status and values
export async function GET() {
  try {
    await connectDB();

    // Next.js hot-reload fix: Force reference User model so Mongoose registers the schema 
    // before the "populate" query runs on the Employee collection.
    const _forceUserRegistration = User.modelName; 

    const session = await getServerSession(authOptions);
    const role = String(session?.user?.role ?? "").toLowerCase();

    if (role !== "admin") {
      return NextResponse.json({ error: "Access Denied: Admin role required." }, { status: 403 });
    }

    // Safer, index-friendly status check. Does not crash if status is missing or null.
    const activeEmployees = await Employee.find({ 
      status: { $in: ["Active", "active", "ACTIVE"] }
    }).populate({
      path: "userId",
      select: "email"
    }).lean();

    // Map active user IDs as string keys
    const activeUserIds = activeEmployees.map((emp: any) => {
      if (emp.userId && typeof emp.userId === "object" && "_id" in emp.userId) {
        return emp.userId._id.toString();
      }
      return emp.userId?.toString();
    }).filter(Boolean);

    // Fetch active leave balances for these user IDs
    const leaveBalances = await LeaveBalance.find({
      userId: { $in: activeUserIds }
    }).lean();

    const employeesList = activeEmployees.map((emp: any) => {
      const userIdStr = emp.userId && typeof emp.userId === "object" && "_id" in emp.userId
        ? emp.userId._id.toString()
        : emp.userId?.toString() || "";

      const emailStr = emp.userId && typeof emp.userId === "object" && "email" in emp.userId
        ? emp.userId.email
        : "";

      const balance = leaveBalances.find(
        (b) => b.userId === userIdStr
      );

      const isCustom = balance ? !!balance.customPolicy : false;

      return {
        userId: userIdStr,
        name: emp.name || "Unnamed Employee",
        email: emailStr || "No Registered Email",
        isCustom,
        policy: {
          // Using optional chaining (?.allocated) and fallback values (??)
          // to prevent crashes on legacy documents missing nested sub-objects.
          ANNUAL: balance?.ANNUAL?.allocated ?? 15,
          SICK: balance?.SICK?.allocated ?? 8,
          CASUAL: balance?.CASUAL?.allocated ?? 6,
          MONTHLY: balance?.MONTHLY?.allocated ?? 2,
        },
      };
    }).filter((emp: any) => emp.userId !== ""); // Filter out null userId objects safely

    return NextResponse.json(employeesList);
  } catch (error: any) {
    console.error("Employee leave policies fetch error:", error);
    return NextResponse.json({ 
      error: "Failed to load active employee list.", 
      details: error.message 
    }, { status: 500 });
  }
}
// POST: Set or update an employee's customized leave allowances & update balance allocations in sync
export async function POST(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const role = String(session?.user?.role ?? "").toLowerCase();

    if (role !== "admin") {
      return NextResponse.json({ error: "Access Denied: Admin role required." }, { status: 403 });
    }

    const body = await req.json();
    const { userId, ANNUAL, SICK, CASUAL, MONTHLY } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const annualNum = Number(ANNUAL);
    const sickNum = Number(SICK);
    const casualNum = Number(CASUAL);
    const monthlyNum = Number(MONTHLY);

    if (
      isNaN(annualNum) || annualNum < 0 ||
      isNaN(sickNum) || sickNum < 0 ||
      isNaN(casualNum) || casualNum < 0 ||
      isNaN(monthlyNum) || monthlyNum < 0
    ) {
      return NextResponse.json({ error: "All leave values must be non-negative integers." }, { status: 400 });
    }

    // 1. Update the employee custom configuration
    const updatedCustomPolicy = await EmployeeLeavePolicy.findOneAndUpdate(
      { userId },
      { $set: { ANNUAL: annualNum, SICK: sickNum, CASUAL: casualNum, MONTHLY: monthlyNum } },
      { upsert: true, new: true }
    );

    // 2. Sync changes directly to LeaveBalance and set customPolicy flag to true
    await LeaveBalance.findOneAndUpdate(
      { userId },
      {
        $set: {
          "ANNUAL.allocated": annualNum,
          "SICK.allocated": sickNum,
          "CASUAL.allocated": casualNum,
          "MONTHLY.allocated": monthlyNum,
          customPolicy: true,
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Leave allowances updated and active balance synced.",
      policy: updatedCustomPolicy,
    });
  } catch (error: any) {
    console.error("Employee leave policies save error:", error);
    return NextResponse.json({ 
      error: "Failed to save customized configuration.", 
      details: error.message 
    }, { status: 500 });
  }
}

// DELETE: Reverts custom configuration to baseline and resets balance allocations
export async function DELETE(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const role = String(session?.user?.role ?? "").toLowerCase();

    if (role !== "admin") {
      return NextResponse.json({ error: "Access Denied: Admin role required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required to remove parameters." }, { status: 400 });
    }

    // 1. Delete custom limit record
    await EmployeeLeavePolicy.findOneAndDelete({ userId });

    // 2. Sync standard baseline limits to active LeaveBalance and set customPolicy flag to false
    await LeaveBalance.findOneAndUpdate(
      { userId },
      {
        $set: {
          "ANNUAL.allocated": 15,
          "SICK.allocated": 8,
          "CASUAL.allocated": 6,
          "MONTHLY.allocated": 2,
          customPolicy: false,
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: "Policy reset back to standard baseline rules.",
    });
  } catch (error: any) {
    console.error("Employee leave policy delete error:", error);
    return NextResponse.json({ 
      error: "Database operation failed.", 
      details: error.message 
    }, { status: 500 });
  }
}