import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import LeavePolicy from "@/modals/LeavePolicy"; // Adjusted to 'models'

export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;

    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Attempt to find the default policy. If it doesn't exist, we create it using schema defaults.
    let policy = await LeavePolicy.findOne({ key: "default" }).lean();

    if (!policy) {
      policy = await LeavePolicy.findOneAndUpdate(
        { key: "default" },
        {},
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();
    }

    return NextResponse.json(policy);
  } catch (error) {
    console.error("Leave policy GET error", error);
    return NextResponse.json({ error: "Failed to query policy" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;

    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    
    const ANNUAL = Number(body.ANNUAL);
    const SICK = Number(body.SICK);
    const CASUAL = Number(body.CASUAL);

    // Validate request inputs before updating the database
    if (
      isNaN(ANNUAL) || ANNUAL < 0 ||
      isNaN(SICK) || SICK < 0 ||
      isNaN(CASUAL) || CASUAL < 0
    ) {
      return NextResponse.json({ error: "Invalid policy values" }, { status: 400 });
    }

    const updatedPolicy = await LeavePolicy.findOneAndUpdate(
      { key: "default" },
      {
        $set: {
          ANNUAL,
          SICK,
          CASUAL,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json(updatedPolicy);
  } catch (error) {
    console.error("Leave policy PUT error", error);
    return NextResponse.json({ error: "Failed to update policy" }, { status: 500 });
  }
}