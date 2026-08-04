import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { listFormattedLeaves, decideLeaveRequest, deleteLeaveRequest } from "@/lib/leave-service";

// GET: Fetches all leaves for the admin panel alongside real-time balance metrics
export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const formatted = await listFormattedLeaves();
    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET Admin leaves error:", error);
    return NextResponse.json({ error: "Failed to load leave records." }, { status: 500 });
  }
}

// PUT: Admin approval and rejection decisions (includes balance refund if rejected)
export async function PUT(req: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { id, action } = await req.json();
    const result = await decideLeaveRequest(id, action);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ id: result.id, status: result.status });
  } catch (error) {
    console.error("PUT Admin leaves error:", error);
    return NextResponse.json({ error: "Failed to update leave request status." }, { status: 500 });
  }
}

// DELETE: Permanently remove a leave request and restore the employee's
// leave balance (used for test/mistaken entries).
export async function DELETE(req: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || "";

    const result = await deleteLeaveRequest(id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ id: result.id, refundedDays: result.refundedDays });
  } catch (error) {
    console.error("DELETE Admin leaves error:", error);
    return NextResponse.json({ error: "Failed to delete leave request." }, { status: 500 });
  }
}
