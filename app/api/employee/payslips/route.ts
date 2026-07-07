import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Employee } from "@/modals/Employee";
import { Payslip } from "@/modals/Payslip";

export async function GET() {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the Employee profile linked to the authenticated User
    const employee = await Employee.findOne({ userId })
      .select("_id")
      .lean<{ _id: any }>();

    const employeeId = employee?._id;
    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee profile not found" },
        { status: 404 }
      );
    }

    const payslips = await Payslip.find({ employeeId })
      .populate("employeeId", "name jobTitle")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(payslips, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch employee payslips:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

