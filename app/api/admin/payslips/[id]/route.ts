import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CompanyDetails from "@/modals/CompanyDetails";
import { Payslip } from "@/modals/Payslip";

// Returns fresh payslip + company details for PDF generation.
// Used by app/components/payslips/PayslipList.tsx via:
//   fetch(`/api/admin/payslips?id=${slip._id}`)
// but having this route prevents build-time type-check issues.

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    await connectDB();

    const id = context.params.id;

    const payslip = await Payslip.findById(id)
      .populate("employeeId", "name jobTitle")
      .lean();

    if (!payslip) {
      return NextResponse.json(
        { error: "Payslip record not found" },
        { status: 404 }
      );
    }

    const companyDetails = await CompanyDetails.findOne().lean();

    return NextResponse.json({ payslip, companyDetails }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch payslip by id:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

