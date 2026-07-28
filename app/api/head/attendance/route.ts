import { NextResponse } from "next/server";
import { getDepartmentHeadContext, getDepartmentMemberUserIds } from "@/lib/department-head";
import {
  getDayAttendanceSheet,
  getUserAttendanceHistory,
  upsertAttendanceRecord,
} from "@/lib/attendance-service";

export const dynamic = "force-dynamic";

// GET ?date=YYYY-MM-DD           → department day sheet
// GET ?userId=&period=            → single member history (must be in department)
export async function GET(request: Request) {
  try {
    const ctx = await getDepartmentHeadContext();
    if (!ctx) {
      return NextResponse.json(
        { error: "Forbidden: Department head access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const userId = searchParams.get("userId");
    const period = searchParams.get("period");

    if (userId) {
      const memberIds = await getDepartmentMemberUserIds(ctx.department, ctx.user.id);
      if (!memberIds.includes(userId)) {
        return NextResponse.json(
          { error: "This employee is outside your department." },
          { status: 403 }
        );
      }
      const history = await getUserAttendanceHistory(userId, period);
      return NextResponse.json(history, { status: 200 });
    }

    if (!date) {
      return NextResponse.json({ error: "Date parameter is required" }, { status: 400 });
    }

    const sheet = await getDayAttendanceSheet(date, {
      department: ctx.department,
      scope: "head",
    });

    return NextResponse.json({ ...sheet, department: ctx.department }, { status: 200 });
  } catch (error) {
    console.error("Head attendance GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: set check-in / check-out for a department member (not for self)
export async function POST(request: Request) {
  try {
    const ctx = await getDepartmentHeadContext();
    if (!ctx) {
      return NextResponse.json(
        { error: "Forbidden: Department head access required." },
        { status: 403 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      userId?: string;
      date?: string;
      checkIn?: string | null;
      checkOut?: string | null;
      status?: string | null;
    };

    if (!body.userId || !body.date) {
      return NextResponse.json(
        { error: "Missing required fields: userId and date" },
        { status: 400 }
      );
    }

    if (body.userId === ctx.user.id) {
      return NextResponse.json(
        { error: "You cannot edit your own attendance record." },
        { status: 403 }
      );
    }

    const memberIds = await getDepartmentMemberUserIds(ctx.department, ctx.user.id);
    if (!memberIds.includes(body.userId)) {
      return NextResponse.json(
        { error: "This employee is outside your department." },
        { status: 403 }
      );
    }

    const result = await upsertAttendanceRecord({
      userId: body.userId,
      date: body.date,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      status: body.status,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ success: true, record: result.record }, { status: 200 });
  } catch (error) {
    console.error("Head attendance POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
