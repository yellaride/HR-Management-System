import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDepartmentHeadContext } from "@/lib/department-head";

export const dynamic = "force-dynamic";

/** Lightweight head-status check used by the sidebar / UI. */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const ctx = await getDepartmentHeadContext();
    return NextResponse.json({
      isHead: Boolean(ctx),
      department: ctx?.department ?? null,
    });
  } catch (error) {
    console.error("GET head/me error:", error);
    return NextResponse.json({ error: "Failed to load head status." }, { status: 500 });
  }
}
