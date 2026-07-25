import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Employee } from "@/modals/Employee";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const TIMEZONE = "Asia/Karachi";

interface EmployeeBirthdayLean {
  name?: string;
  designation?: string;
  department?: string;
  dateOfBirth?: Date | null;
}

export async function GET() {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const currentEmployee = (await Employee.findOne({
      userId,
      status: "Active",
    }).lean()) as EmployeeBirthdayLean | null;

    if (!currentEmployee?.dateOfBirth) {
      return NextResponse.json({ isBirthday: false });
    }

    const now = new Date();
    const todayParts = new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE,
      month: "numeric",
      day: "numeric",
    }).formatToParts(now);

    const currentMonth = parseInt(
      todayParts.find((p) => p.type === "month")?.value || "0",
      10
    );
    const currentDay = parseInt(
      todayParts.find((p) => p.type === "day")?.value || "0",
      10
    );

    // DOB is stored as a calendar date — compare UTC date parts to avoid TZ day-shift.
    const dob = new Date(currentEmployee.dateOfBirth);
    const birthMonth = dob.getUTCMonth() + 1;
    const birthDay = dob.getUTCDate();

    const isBirthday = currentMonth === birthMonth && currentDay === birthDay;

    return NextResponse.json(
      {
        isBirthday,
        name: currentEmployee.name,
        designation: currentEmployee.designation,
        department: currentEmployee.department,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json(
      { error: message || "Failed to verify birthday status" },
      { status: 500 }
    );
  }
}
