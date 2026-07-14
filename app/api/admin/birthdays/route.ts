import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb"; // Utilizing path alias for connectivity config
import { Employee } from "@/modals/Employee";
import { sendBirthdayEmail } from "@/lib/email/birthday-email"; // Ensure this matches your mailing engine

// GET: Fetch birthdays for all active employees
export async function GET() {
  try {
    await connectDB();

    // Query active employees and grab their linked login emails
    const employees = await Employee.find({ status: { $ne: "Inactive" } })
      .populate("userId", "email");

    // Format fields dynamically so the client-side component can read them instantly
    const formattedBirthdays = employees
      .filter((emp: any) => emp.birthDate) // Only evaluate profiles with input birthdates
      .map((emp: any) => {
        const bDate = new Date(emp.birthDate);
        return {
          id: emp._id.toString(),
          name: emp.name,
          email: emp.userId?.email || "",
          department: emp.department,
          designation: emp.designation,
          birthDate: bDate.toISOString().split("T")[0], // YYYY-MM-DD
          birthDay: bDate.getUTCDate(), // 1 - 31 (using UTC values preserves date boundaries)
          birthMonth: bDate.getUTCMonth(), // 0 - 11 (0-indexed matching your UI array mappings)
          visibility: emp.birthdayVisibility || "everyone",
          emailStatus: emp.birthdayEmailStatus || "Pending",
        };
      });

    return NextResponse.json(formattedBirthdays, { status: 200 });
  } catch (error: any) {
    console.error("Birthday data query processing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load birthday records database feed" },
      { status: 500 }
    );
  }
}

// PUT: Modify privacy restrictions or manually trigger email greetings
export async function PUT(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, action, visibility } = body;

    if (!id || !action) {
      return NextResponse.json({ error: "Missing required parameters (id, action)" }, { status: 400 });
    }

    const employee = await Employee.findById(id).populate("userId", "email");
    if (!employee) {
      return NextResponse.json({ error: "Employee profile record not found" }, { status: 404 });
    }

    // Process Action A: Update Visibility Restrictions
    if (action === "UPDATE_PRIVACY") {
      if (!visibility || !["everyone", "admin", "hidden"].includes(visibility)) {
        return NextResponse.json({ error: "Invalid privacy parameter" }, { status: 400 });
      }
      
      employee.birthdayVisibility = visibility;
      await employee.save();

      return NextResponse.json({ 
        message: "Roster privacy preferences modified",
        visibility: employee.birthdayVisibility 
      }, { status: 200 });
    }

    // Process Action B: Force Manual Wish Dispatcher
    if (action === "SEND_WISH") {
      const userEmail = (employee.userId as any)?.email;
      if (!userEmail) {
        return NextResponse.json({ error: "No verified user email mapped to this directory record" }, { status: 400 });
      }

      // Safeguard email routing call
      const emailSent = await sendBirthdayEmail(employee.name, userEmail);
      
      employee.birthdayEmailStatus = "Sent";
      await employee.save();

      return NextResponse.json({ 
        message: emailSent 
          ? "Birthday greeting dispatched successfully" 
          : "Wishes marked as sent (delivery pending domain setup configuration)",
        emailStatus: employee.birthdayEmailStatus
      }, { status: 200 });
    }

    return NextResponse.json({ error: "Requested operation action not supported" }, { status: 400 });
  } catch (error: any) {
    console.error("Birthday update database processing error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute database modifications" },
      { status: 500 }
    );
  }
}