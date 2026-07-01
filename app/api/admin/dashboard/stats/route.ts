import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Employee } from "@/modals/Employee";

export async function GET() {
  try {
    await connectDB();

    const activeEmployeesFilter = { status: { $ne: "Inactive" } };

    const totalEmployees = await Employee.countDocuments(activeEmployeesFilter);

    const departments = await Employee.distinct("department", activeEmployeesFilter);
    const totalDepartments = Array.isArray(departments) ? departments.filter(Boolean).length : 0;

    return NextResponse.json(
      {
        totalEmployees,
        totalDepartments,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to fetch dashboard stats:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

