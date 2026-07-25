// app/api/cron/birthday/route.ts (or your cron route path)
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Employee } from "@/modals/Employee";
import { ActivityLog } from "@/modals/ActivityLog";
import { sendBirthdayEmail } from "@/lib/email/birthday-email";

const TIMEZONE = "Asia/Karachi";

// Shape of the lean employee docs read by this cron (with populated userId email)
interface CelebrantEmployee {
  _id: { toString(): string };
  name: string;
  designation: string;
  department: string;
  userId?: { _id?: { toString(): string }; email?: string } | null;
}

export const dynamic = "force-dynamic";

function getKarachiDateComponents(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  
  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value || "";
  const month = parts.find((p) => p.type === "month")?.value || "";
  const day = parts.find((p) => p.type === "day")?.value || "";
  
  const formattedMonth = String(month).padStart(2, "0");
  const formattedDay = String(day).padStart(2, "0");

  return {
    year: parseInt(year),
    monthIdx: parseInt(month) - 1, 
    dayNum: parseInt(day),
    dateStr: `${year}-${formattedMonth}-${formattedDay}`,
  };
}

export async function GET(request: Request) {
  try {
    await connectDB();

    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // CRON_SECRET is mandatory: without it this endpoint stays locked.
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const now = new Date();
    const local = getKarachiDateComponents(now);

    const targetMonthMongo = local.monthIdx + 1;
    const targetDayMongo = local.dayNum;

    // Fetch active employees celebrating today, EXCLUDING those who successfully received an email this year
    const celebrants = (await Employee.find({
      status: "Active",
      dateOfBirth: { $ne: null },
      $or: [
        { birthdayVisibility: { $exists: false } },
        { birthdayVisibility: { $ne: "hidden" } }
      ],
      // Exclude only if they have a "Sent" status for the current localized year
      $nor: [
        {
          birthdayEmailStatus: "Sent",
          birthdayEmailSentYear: local.year
        }
      ],
      $expr: {
        $and: [
          { $eq: [{ $month: "$dateOfBirth" }, targetMonthMongo] },
          { $eq: [{ $dayOfMonth: "$dateOfBirth" }, targetDayMongo] }
        ]
      }
    })
    .populate("userId", "email")
    .lean()) as unknown as CelebrantEmployee[];

    if (celebrants.length === 0) {
      return NextResponse.json({
        message: "No employee birthdays found matching today's Karachi date.",
        date: local.dateStr
      }, { status: 200 });
    }

    const results = [];

    for (const emp of celebrants) {
      const email = emp.userId?.email?.trim();

      if (!email) {
        results.push({
          id: emp._id,
          name: emp.name,
          status: "Skipped",
          email: null,
          reason: "No linked user email",
        });
        continue;
      }

      const emailSent = await sendBirthdayEmail(
        email,
        emp.name,
        emp.designation,
        emp.department
      );

      console.log("Birthday email result:", {
        employee: emp.name,
        email,
        emailSent
      });

      if (emailSent) {
        // Success: set status to "Sent" and record the current year
        await Employee.updateOne(
          { _id: emp._id },
          { 
            $set: { 
              birthdayEmailStatus: "Sent",
              birthdayEmailSentYear: local.year 
            } 
          }
        );

        await ActivityLog.create({
          userId: emp.userId?._id?.toString() || emp._id.toString(),
          activityType: "BIRTHDAY_EMAIL",
          date: local.dateStr,
          timestamp: new Date(),
          description: `Automated birthday email successfully delivered to ${emp.name} (${email}).`,
          metadata: {
            status: "Sent",
            emailAddress: email
          }
        });

        results.push({ id: emp._id, name: emp.name, status: "Success", email });
      } else {
        // Failure: set status to "Failed" but don't save the current year so it can retry later
        await Employee.updateOne(
          { _id: emp._id },
          { $set: { birthdayEmailStatus: "Failed" } }
        );

        await ActivityLog.create({
          userId: emp.userId?._id?.toString() || emp._id.toString(),
          activityType: "BIRTHDAY_EMAIL",
          date: local.dateStr,
          timestamp: new Date(),
          description: `Failed automated birthday email delivery attempt for ${emp.name} (${email}).`,
          metadata: {
            status: "Failed",
            emailAddress: email
          }
        });

        results.push({ id: emp._id, name: emp.name, status: "Failed", email });
      }
    }

    return NextResponse.json({
      message: `Completed automated birthday processing inside Asia/Karachi on date ${local.dateStr}`,
      processedCount: celebrants.length,
      results
    }, { status: 200 });

  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json({
      error: "Automated birthday cron execution failed",
      details: message || String(error)
    }, { status: 500 });
  }
}