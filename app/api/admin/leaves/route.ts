import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { listFormattedLeaves, decideLeaveRequest } from "@/lib/leave-service";

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
