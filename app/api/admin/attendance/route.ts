import { NextResponse } from "next/server";

// Compatibility layer: some admin pages/components still call /api/admin/attendance.
// Delegate to the correct route: /api/admin/employee-attendance.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const forwarded = `${url.origin}/api/admin/employee-attendance${url.search}`;

  const res = await fetch(forwarded, { method: "GET", headers: req.headers });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const forwarded = `${url.origin}/api/admin/employee-attendance`;

  const body = await req.text();

  const res = await fetch(forwarded, {
    method: "POST",
    headers: { "Content-Type": req.headers.get("content-type") ?? "application/json" },
    body,
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

