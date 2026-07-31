import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { getAdminUser } from "@/lib/auth";
import CompanyDetails from "@/modals/CompanyDetails";
import { DepartmentHead } from "@/modals/DepartmentHead";
import { Employee } from "@/modals/Employee";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    let body: { oldName?: unknown; newName?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }

    const oldName = typeof body.oldName === "string" ? body.oldName.trim() : "";
    const newName = typeof body.newName === "string" ? body.newName.trim() : "";

    if (!oldName || !newName) {
      return NextResponse.json(
        { error: "Both current and new department names are required." },
        { status: 400 }
      );
    }

    if (oldName === newName) {
      return NextResponse.json(
        { error: "New name must be different from the current name." },
        { status: 400 }
      );
    }

    await dbConnect();

    const company = await CompanyDetails.findOne();
    if (!company) {
      return NextResponse.json({ error: "Department not found." }, { status: 404 });
    }

    const departments: string[] = Array.isArray(company.departments) ? company.departments : [];

    if (!departments.includes(oldName)) {
      return NextResponse.json({ error: "Department not found." }, { status: 404 });
    }

    const nameTaken = departments.some(
      (dept: string) => dept !== oldName && dept.toLowerCase() === newName.toLowerCase()
    );
    if (nameTaken) {
      return NextResponse.json(
        { error: "A department with this name already exists." },
        { status: 409 }
      );
    }

    company.departments = departments.map((dept: string) => (dept === oldName ? newName : dept));
    await company.save();

    await Promise.all([
      DepartmentHead.updateOne({ department: oldName }, { $set: { department: newName } }),
      Employee.updateMany({ department: oldName }, { $set: { department: newName } }),
    ]);

    return NextResponse.json({ departments: company.departments });
  } catch (error: unknown) {
    console.error("PATCH department rename error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Failed to rename department: " + message }, { status: 500 });
  }
}
