import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/modals/User";
import { Employee } from "@/modals/Employee";
import CompanyDetails from "@/modals/CompanyDetails"; 

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { name, email, designation, joinDate, department, status, salary } = body;

    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json({ error: "Employee profile not found" }, { status: 404 });
    }

    let finalEmail = "";
    if (employee.userId) {
      const user = await User.findById(employee.userId);
      if (user) {
        if (email && email.trim()) {
          const emailLower = email.trim().toLowerCase();
          const existingUser = await User.findOne({ 
            email: emailLower, 
            _id: { $ne: employee.userId } 
          });
          if (existingUser) {
            return NextResponse.json({ error: "This email is already in use by another account" }, { status: 400 });
          }
          user.email = emailLower;
          await user.save();
          finalEmail = emailLower;
        } else {
          finalEmail = user.email || "";
        }
      }
    }

    employee.name = typeof name === "string" && name.trim() ? name.trim() : employee.name;
    employee.designation = typeof designation === "string" && designation.trim()
      ? designation.trim()
      : employee.designation || employee.jobTitle || "";
    employee.joinDate = joinDate ? new Date(joinDate) : employee.joinDate;
    
    // Process base salary and recalculate hourly rate.
    // If salary is cleared (null/empty), save salary as null so UI shows N/A after refresh.
    if (salary === "" || salary === null || salary === undefined) {
      employee.set("salary", null);
      employee.set("hourlyRate", null);
      employee.markModified("salary");
      employee.markModified("hourlyRate");
    } else {
      const salaryNumber = Number(salary);
      if (!Number.isNaN(salaryNumber)) {
        employee.set("salary", salaryNumber);

        // Retrieve Standard Working Hours
        let standardHours = 160;
        try {
          const company = await CompanyDetails.findOne();
          if (company && company.standardWorkingHours && company.standardWorkingHours > 0) {
            standardHours = company.standardWorkingHours;
          }
        } catch (err) {
          console.warn("Unable to fetch Company Details, using fallback 160:", err);
        }

        // Calculate and explicitly set the hourly rate
        const calculatedHourly = salaryNumber / standardHours;
        employee.set("hourlyRate", calculatedHourly);

        employee.markModified("salary");
        employee.markModified("hourlyRate");
      }
    }


    employee.jobTitle = employee.designation;
    employee.department = department || employee.department;
    employee.status = status || employee.status;
    await employee.save();

    const updatedEmployee = {
      id: employee._id.toString(),
      name: employee.name,
      role: employee.designation ?? employee.jobTitle,
      email: finalEmail,
      department: employee.department,
      status: employee.status,
      designation: employee.designation,
      joinDate: employee.joinDate ? employee.joinDate.toISOString() : undefined,
      salary: typeof employee.salary === "number" ? employee.salary : undefined,
      // If salary cleared, return hourlyRate as undefined so UI can show N/A.
      hourlyRate: typeof employee.hourlyRate === "number" ? employee.hourlyRate : undefined,
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

    // 2. Soft-delete profile entry (keep employee record, only mark inactive)
    employee.status = "Inactive";
    await employee.save();

    return NextResponse.json({ 
      message: "Employee profile and system credentials deleted successfully" 
    });

  } catch (error: any) {
    console.error("Profile deletion error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}