import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Payslip } from "@/modals/Payslip";
import { Employee } from "@/modals/Employee";

export async function GET() {
  try {
    await connectDB();
    const payslips = await Payslip.find()
      .populate("employeeId", "name jobTitle")
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json(payslips, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch payslips:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      employeeId,
      period,
      basicSalary,
      allowances,
      bonus,
      deductions,
      paymentMethod,
      paymentDate,
    } = body;

    if (!employeeId || !period || basicSalary === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Fetch employee details to save historical snapshot fields
    const employee = await Employee.findById(employeeId).lean();
    const employeeName = employee 
      ? (employee.name || `${employee.firstName || ""} ${employee.lastName || ""}`.trim()) 
      : "Unknown Employee";
    const employeeRole = employee 
      ? (employee.jobTitle || employee.role || "No Specified Title") 
      : "No Specified Title";

    // Server-side calculation verification
    const calculatedNetPay =
      Number(basicSalary) +
      Number(allowances || 0) +
      Number(bonus || 0) -
      Number(deductions || 0);

    // 2. Save the snapshot fields in the database document
    const newPayslip = await Payslip.create({
      employeeId,
      employeeName, // Saved historically
      employeeRole, // Saved historically
      period,
      basicSalary: Number(basicSalary),
      allowances: Number(allowances || 0),
      bonus: Number(bonus || 0),
      deductions: Number(deductions || 0),
      netPay: calculatedNetPay,
      paymentMethod,
      paymentDate: new Date(paymentDate),
    });

    const populatedPayslip = await Payslip.findById(newPayslip._id)
      .populate("employeeId", "name jobTitle")
      .lean();

    if (!populatedPayslip) {
      throw new Error("Failed to retrieve the generated payslip document.");
    }

    return NextResponse.json(populatedPayslip, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create payslip record:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}