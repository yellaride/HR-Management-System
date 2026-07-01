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
      netPay,
      paymentMethod,
      paymentDate,
    } = body;

    const parsedBasicSalary = Number(basicSalary);
    const parsedAllowances = Number(allowances || 0);
    const parsedBonus = Number(bonus || 0);
    const parsedDeductions = Number(deductions || 0);
    const parsedNetPay = Number(
      netPay ?? parsedBasicSalary + parsedAllowances + parsedBonus - parsedDeductions
    );
    const parsedPaymentDate = paymentDate ? new Date(paymentDate) : undefined;

    if (!employeeId || !period || Number.isNaN(parsedBasicSalary) || parsedBasicSalary <= 0) {
      return NextResponse.json(
        { error: "Missing required fields or invalid salary value" },
        { status: 400 }
      );
    }

    // 1. Fetch employee details to save historical snapshot fields
    const employee = await Employee.findById(employeeId).lean();
    const employeeName = employee && typeof employee === "object" && "name" in employee
      ? (employee.name || `${(employee as any).firstName || ""} ${(employee as any).lastName || ""}`.trim())
      : "Unknown Employee";
    const employeeRole = employee && typeof employee === "object"
      ? ((employee as any).jobTitle || (employee as any).role || "No Specified Title")
      : "No Specified Title";

    // 2. Save the snapshot fields in the database document
    const newPayslip = await Payslip.create({
      employeeId,
      employeeName, // Saved historically
      employeeRole, // Saved historically
      period,
      basicSalary: parsedBasicSalary,
      allowances: parsedAllowances,
      bonus: parsedBonus,
      deductions: parsedDeductions,
      netPay: parsedNetPay,
      paymentMethod,
      paymentDate: parsedPaymentDate,
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