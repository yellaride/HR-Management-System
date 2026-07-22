import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CompanyDetails from "@/modals/CompanyDetails";
import { Payslip } from "@/modals/Payslip";
import { Employee } from "@/modals/Employee";
import { getSessionUser } from "@/lib/auth";

// Returns fresh payslip + company details for PDF generation.

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    // Lean payslip doc; only employeeId is inspected directly, the rest is returned as-is
    interface LeanPayslip extends Record<string, unknown> {
      employeeId?: { _id?: { toString(): string } } | null;
    }
    const payslip = (await Payslip.findById(id)
      .populate("employeeId", "name jobTitle profilePhotoUrl")
      .lean()) as unknown as LeanPayslip | null;

    if (!payslip) {
      return NextResponse.json(
        { error: "Payslip record not found" },
        { status: 404 }
      );
    }

    // Ownership check: employees may only fetch their own payslips
    if (sessionUser.role !== "admin") {
      const ownEmployee = (await Employee.findOne({ userId: sessionUser.id })
        .select("_id")
        .lean()) as { _id: { toString(): string } } | null;
      const ownEmployeeId = ownEmployee?._id?.toString() || "";
      const payslipEmployeeId =
        payslip.employeeId?._id?.toString() || payslip.employeeId?.toString() || "";
      if (!ownEmployeeId || payslipEmployeeId !== ownEmployeeId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const companyDetails = await CompanyDetails.findOne().lean();

    return NextResponse.json({ payslip, companyDetails }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch payslip by id:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
