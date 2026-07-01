// app/api/employees/route.ts
import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb"; // Adjust import path if needed
import  User from "@/modals/User";
import { Employee } from "@/modals/Employee";
import bcrypt from "bcryptjs";

// GET Endpoint: Fetch all employees and populate email from Users table
export async function GET() {
  try {
    await connectDB();

// Populate the userId reference to grab the email field
    const employees = await Employee.find({ status: { $ne: "Inactive" } }).populate("userId", "email");

    // Format data to match the React Employee interface
    const formattedEmployees = employees.map((emp: any) => ({
      id: emp._id.toString(),
      name: emp.name,
      role: emp.jobTitle, // Maps 'jobTitle' db field to UI 'role'
      email: emp.userId?.email || "",
      department: emp.department,
      status: emp.status,
      designation: emp.designation,
      joinDate: emp.joinDate ? new Date(emp.joinDate).toISOString() : undefined,
      salary: typeof emp.salary === "number" ? emp.salary : (emp.salary ? Number(emp.salary) : undefined),
    }));


    return NextResponse.json(formattedEmployees, { status: 200 });
  } catch (error: any) {
    console.error("Fetch employees error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load directory" },
      { status: 500 }
    );
  }
}

// POST Endpoint: Create User and Employee profiles
export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, password, department, status, designation, joinDate, role, salary } = body;
    const assignedRole = role;

    // Validate request inputs
    if (!name || !email || !password || !department || !designation || !joinDate || !role || salary === undefined) {

      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }


    // Check if the user email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Hash the raw temporary password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create credentials in Users collection
    const newUser = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: assignedRole, // System access authorization level ("employee" | "admin")
    });

    // 2. Create the profile mapping inside Employees collection
    const newEmployee = await Employee.create({
      userId: newUser._id,
      name,
      designation,
      joinDate: new Date(joinDate),
      department,
      salary: Number(salary),
      status: status || "Active",

      // Back-compat: keep jobTitle in sync with designation if your UI still reads role/jobTitle
      jobTitle: designation,
    });


    // Format payload to return clean frontend-ready structure
    const formattedNewEmployee = {
      id: newEmployee._id.toString(),
      name: newEmployee.name,
      role: newEmployee.designation ?? newEmployee.jobTitle,
      email: email.toLowerCase(),
      department: newEmployee.department,
      status: newEmployee.status,
    };

    return NextResponse.json(
      {
        message: "Employee registered successfully",
        employee: formattedNewEmployee,
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Database registration error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}