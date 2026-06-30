// app/api/employees/[id]/route.ts (or app/api/admin/employees/[id]/route.ts)
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb" 
import User from "@/modals/User";
import { Employee } from "@/modals/Employee";

// PUT: Update Employee profile and sync User Email
export async function PUT(
  request: Request, 
  { params }: { params: Promise<{ id: string }> } // Typed as Promise in Next.js 15
) {
  try {
    await connectDB();
    const { id } = await params; // Awaited in Next.js 15
    const body = await request.json();
    const { name, email, role: jobTitle, department, status } = body;

    // 1. Locate the employee profile
    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
    }

    // 2. Update linked User credentials if email was changed
    if (email && employee.userId) {
      const emailLower = email.toLowerCase();
      
      const existingUser = await User.findOne({ 
        email: emailLower, 
        _id: { $ne: employee.userId } 
      });
      if (existingUser) {
        return NextResponse.json({ error: "This email is already in use by another account" }, { status: 400 });
      }

      await User.findByIdAndUpdate(employee.userId, { email: emailLower });
    }

    // 3. Update Employee profile details
    employee.name = name || employee.name;
    employee.jobTitle = jobTitle || employee.jobTitle;
    employee.department = department || employee.department;
    employee.status = status || employee.status;
    await employee.save();

    const updatedEmployee = {
      id: employee._id.toString(),
      name: employee.name,
      role: employee.jobTitle,
      email: email ? email.toLowerCase() : "",
      department: employee.department,
      status: employee.status,
    };

    return NextResponse.json({
      message: "Employee profile updated successfully",
      employee: updatedEmployee,
    });

  } catch (error: any) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// DELETE: Remove profile and credential entries
export async function DELETE(
  request: Request, 
  { params }: { params: Promise<{ id: string }> } // Typed as Promise in Next.js 15
) {
  try {
    await connectDB();
    const { id } = await params; // Awaited in Next.js 15

    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
    }

    // 1. Remove credential entry from Users table
    if (employee.userId) {
      await User.findByIdAndDelete(employee.userId);
    }

    // 2. Remove profile entry from Employees table
    await Employee.findByIdAndDelete(id);

    return NextResponse.json({ 
      message: "Employee profile and system credentials deleted successfully" 
    });

  } catch (error: any) {
    console.error("Profile deletion error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}