import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb"; // Adjust relative path as needed
import User from "@/modals/User";
import { Employee } from "@/modals/Employee";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/email"; // Adjust alias path if needed

// GET Endpoint: Fetch all active employees
export async function GET() {
  try {
    await connectDB();

    // Populate the userId reference to grab the email field
    const employees = await Employee.find({ status: { $ne: "Inactive" } }).populate("userId", "email");

    // Format data to match the UI interface structure
    const formattedEmployees = employees.map((emp: any) => ({
      id: emp._id.toString(),
      name: emp.name,
      role: emp.designation, // Replaced jobTitle with designation
      email: emp.userId?.email || "",
      department: emp.department,
      status: emp.status,
      designation: emp.designation,
      // Ensure UI modals always receive these fields
      joinDate: emp.joinDate ? new Date(emp.joinDate).toISOString() : null,
      salary: emp.salary !== undefined && emp.salary !== null ? Number(emp.salary) : null,
      // Optional aliases (helps if some frontend expects other keys)
      joiningDate: emp.joinDate ? new Date(emp.joinDate).toISOString() : null,
      salaryDate: emp.salary !== undefined && emp.salary !== null ? Number(emp.salary) : null,
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
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedDesignation = typeof designation === "string" ? designation.trim() : "";
    const normalizedDepartment = typeof department === "string" ? department.trim() : "";

    // Validate request inputs
    if (!normalizedName || !email || !password || !normalizedDepartment || !normalizedDesignation || !joinDate || !role || salary === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    // Check if the user email already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Hash the raw temporary password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Safeguard and convert inputs to proper database-ready formats
    const parsedJoinDate = new Date(joinDate);
    if (isNaN(parsedJoinDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid join date format" },
        { status: 400 }
      );
    }

    const parsedSalary = Number(salary);
    if (isNaN(parsedSalary)) {
      return NextResponse.json(
        { error: "Salary must be a valid number" },
        { status: 400 }
      );
    }

    // 1. Create access credentials in Users collection
    const newUser = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole, 
    });

    // 2. Create the profile mapping inside Employees collection
    const newEmployee = await Employee.create({
      userId: newUser._id,
      name: normalizedName,
      designation: normalizedDesignation,
      joinDate: parsedJoinDate,
      department: normalizedDepartment,
      salary: parsedSalary,
      status: typeof status === "string" && status.trim() ? status.trim() : "Active",
      jobTitle: normalizedDesignation,
    });

    // 3. Dispatch the welcome email safely
    const emailSent = await sendWelcomeEmail(name, normalizedEmail, password);

    // Format payload to return clean frontend-ready structure
    const formattedNewEmployee = {
      id: newEmployee._id.toString(),
      name: newEmployee.name,
      role: newEmployee.designation,
      email: normalizedEmail,
      department: newEmployee.department,
      status: newEmployee.status,
      designation: newEmployee.designation,
      joinDate: newEmployee.joinDate ? newEmployee.joinDate.toISOString() : undefined,
      salary: typeof newEmployee.salary === "number" ? newEmployee.salary : (newEmployee.salary ? Number(newEmployee.salary) : undefined),
    };

    return NextResponse.json(
      {
        message: emailSent 
          ? "Employee registered and welcome email sent successfully" 
          : "Employee registered successfully (email delivery pending domain setup)",
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