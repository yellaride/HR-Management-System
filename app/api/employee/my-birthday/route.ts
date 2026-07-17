// app/api/employee/birthday/route.ts
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Employee } from "@/modals/Employee";
import { getServerSession } from "next-auth";

const TIMEZONE = "Asia/Karachi";

export async function GET() {
  try {
    await connectDB();
    
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const email = session.user.email.toLowerCase().trim();

    // Retrieve active employees and find the one matching the current session email
    const employees = await Employee.find({ status: "Active" }).populate("userId", "email");
    const currentEmployee = employees.find(
      (emp) => emp.userId?.email?.toLowerCase().trim() === email
    );

    if (!currentEmployee || !currentEmployee.dateOfBirth) {
      return NextResponse.json({ isBirthday: false });
    }

    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE,
      month: "numeric",
      day: "numeric",
    });
    
    const parts = formatter.formatToParts(now);
    const currentMonth = parseInt(parts.find((p) => p.type === "month")?.value || "0");
    const currentDay = parseInt(parts.find((p) => p.type === "day")?.value || "0");

    const dob = new Date(currentEmployee.dateOfBirth);
    const birthMonth = dob.getMonth() + 1; // Convert 0-indexed month to 1-indexed
    const birthDay = dob.getDate();

    const isBirthday = currentMonth === birthMonth && currentDay === birthDay;

    return NextResponse.json({
      isBirthday,
      name: currentEmployee.name,
      designation: currentEmployee.designation,
      department: currentEmployee.department
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to verify birthday status" }, 
      { status: 500 }
    );
  }
}