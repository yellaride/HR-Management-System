import { NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { getAdminUser } from "@/lib/auth";
import { DepartmentHead } from "@/modals/DepartmentHead";
import { Employee } from "@/modals/Employee";
import User from "@/modals/User";
import CompanyDetails from "@/modals/CompanyDetails";

export const dynamic = "force-dynamic";

interface LeanEmployeeOption {
  userId?: { toString(): string };
  name?: string;
  designation?: string;
  department?: string;
}

interface LeanHead {
  department: string;
  userId?: { toString(): string };
}

// GET: current heads per department + eligible (active) employees for assignment
export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    await dbConnect();

    const [heads, employees] = await Promise.all([
      DepartmentHead.find().lean<LeanHead[]>(),
      Employee.find({ status: { $ne: "Inactive" } })
        .select("userId name designation department")
        .lean<LeanEmployeeOption[]>(),
    ]);

    const employeeByUserId = new Map(
      employees.map((e) => [e.userId ? e.userId.toString() : "", e])
    );

    const formattedHeads = heads.map((h) => {
      const headUserId = h.userId ? h.userId.toString() : "";
      const emp = employeeByUserId.get(headUserId);
      return {
        department: h.department,
        userId: headUserId,
        name: emp?.name || "Unknown employee",
        designation: emp?.designation || "",
      };
    });

    const formattedEmployees = employees
      .filter((e) => e.userId)
      .map((e) => ({
        userId: e.userId ? e.userId.toString() : "",
        name: e.name || "Employee",
        designation: e.designation || "",
        department: e.department || "",
      }));

    return NextResponse.json({ heads: formattedHeads, employees: formattedEmployees });
  } catch (error) {
    console.error("GET department-heads error:", error);
    return NextResponse.json({ error: "Failed to load department heads." }, { status: 500 });
  }
}

// PUT: assign or remove a department head — body: { department, userId | null }
export async function PUT(request: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    await dbConnect();

    const body = (await request.json().catch(() => null)) as {
      department?: unknown;
      userId?: unknown;
    } | null;

    const department = typeof body?.department === "string" ? body.department.trim() : "";
    const userId =
      typeof body?.userId === "string" && body.userId.trim() ? body.userId.trim() : null;

    if (!department) {
      return NextResponse.json({ error: "Department is required." }, { status: 400 });
    }

    const company = await CompanyDetails.findOne().select("departments").lean<{
      departments?: string[];
    } | null>();
    if (!company?.departments?.includes(department)) {
      return NextResponse.json({ error: "Department does not exist." }, { status: 404 });
    }

    // Remove head
    if (!userId) {
      await DepartmentHead.deleteOne({ department });
      return NextResponse.json({ success: true, head: null });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user reference." }, { status: 400 });
    }

    const [user, employee] = await Promise.all([
      User.findById(userId).select("role").lean<{ role?: string } | null>(),
      Employee.findOne({ userId })
        .select("name designation department status")
        .lean<{ name?: string; designation?: string; department?: string; status?: string } | null>(),
    ]);

    if (!user || user.role !== "employee" || !employee) {
      return NextResponse.json(
        { error: "Only an existing employee account can be assigned as head." },
        { status: 400 }
      );
    }

    if (employee.status === "Inactive") {
      return NextResponse.json(
        { error: "Inactive employees cannot be assigned as department head." },
        { status: 400 }
      );
    }

    if (employee.department !== department) {
      return NextResponse.json(
        { error: `${employee.name || "This employee"} is not a member of ${department}.` },
        { status: 400 }
      );
    }

    // One user can head only one department at a time
    const existingElsewhere = await DepartmentHead.findOne({
      userId,
      department: { $ne: department },
    }).lean<{ department?: string } | null>();
    if (existingElsewhere) {
      return NextResponse.json(
        { error: `This employee is already head of ${existingElsewhere.department}.` },
        { status: 409 }
      );
    }

    // One head per department — replaces any previous head atomically
    await DepartmentHead.findOneAndUpdate(
      { department },
      { $set: { userId, assignedBy: admin.id } },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      head: {
        department,
        userId,
        name: employee.name || "Employee",
        designation: employee.designation || "",
      },
    });
  } catch (error) {
    console.error("PUT department-heads error:", error);
    return NextResponse.json({ error: "Failed to update department head." }, { status: 500 });
  }
}
