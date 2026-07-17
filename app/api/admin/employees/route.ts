import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/modals/User";
import { Employee } from "@/modals/Employee";
import CompanyDetails from "@/modals/CompanyDetails"; // Adjust this path to match where your model is saved
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/email/welcome-email";

export async function GET() {
  try {
    await connectDB();

    // DEBUG: verify numeric values exist
    const employees = await Employee.find({ status: { $ne: "Inactive" } }).populate("userId", "email");


    // Map backend properties so frontend gets consistent keys for dates + compensation
    const formattedEmployees = employees.map((emp: any) => ({
      id: emp._id.toString(),
      name: emp.name,
      email: emp.userId?.email || "",
      department: emp.department,
      status: emp.status,
      designation: emp.designation,
      joinDate: emp.joinDate ? new Date(emp.joinDate).toISOString() : null,
      salary: emp.salary !== undefined && emp.salary !== null ? Number(emp.salary) : 0,
      hourlyRate:
        emp.hourlyRate !== undefined && emp.hourlyRate !== null
          ? Number(emp.hourlyRate)
          : 0,
      // Cloudinary image link stored in DB
      profilePhotoUrl: emp.profilePhotoUrl || emp.profilePhotoURL || "",
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

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, password, department, status, designation, joinDate, salary } = body;

    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedDesignation = typeof designation === "string" ? designation.trim() : "";
    const normalizedDepartment = typeof department === "string" ? department.trim() : "";

    if (!normalizedName || !email || !password || !normalizedDepartment || !normalizedDesignation || !joinDate || salary === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const parsedJoinDate = new Date(joinDate);
    if (isNaN(parsedJoinDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid join date format" },
        { status: 400 }
      );
    }

    const parsedSalary = Number(salary);
    if (isNaN(parsedSalary) || parsedSalary < 0) {
      return NextResponse.json(
        { error: "Salary must be a valid positive number" },
        { status: 400 }
      );
    }

    // 1. Retrieve Standard Working Hours from Company Settings
   let standardHours = 160; // Fallback default
try {
  const company = await CompanyDetails.findOne();
  if (company && company.standardWorkingHours && company.standardWorkingHours > 0) {
    standardHours = company.standardWorkingHours;
  }
} catch (err) {
  console.warn("Unable to fetch Company Details, using fallback 160 hours:", err);
}

// 2. Calculate Hourly Rate
const parsedHourlyRate = parsedSalary / standardHours;

    console.log("[Employee POST] received salary:", salary);
    console.log("[Employee POST] parsedSalary:", parsedSalary);
    console.log("[Employee POST] standardHours:", standardHours);
    console.log("[Employee POST] parsedHourlyRate:", parsedHourlyRate);


    const assignedRole = "employee"; 

    const newUser = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole,
    });

    const newEmployee = await Employee.create({
      userId: newUser._id,
      name: normalizedName,
      designation: normalizedDesignation,
      joinDate: parsedJoinDate,
      department: normalizedDepartment,
      salary: parsedSalary,
      hourlyRate: parsedHourlyRate, // Saved programmatically to the database
      status: typeof status === "string" && status.trim() ? status.trim() : "Active",
      jobTitle: normalizedDesignation,
    });

    const emailSent = await sendWelcomeEmail(name, normalizedEmail, password);

    const formattedNewEmployee = {
      id: newEmployee._id.toString(),
      name: newEmployee.name,
      role: newEmployee.designation,
      email: normalizedEmail,
      department: newEmployee.department,
      status: newEmployee.status,
      designation: newEmployee.designation,
      joinDate: newEmployee.joinDate ? newEmployee.joinDate.toISOString() : undefined,
      salary: typeof newEmployee.salary === "number" ? newEmployee.salary : undefined,
      hourlyRate:
        typeof (newEmployee as any).hourlyRate === "number" ? (newEmployee as any).hourlyRate : undefined,
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