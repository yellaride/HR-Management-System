import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";

import dbConnect from "@/lib/mongodb";
import User from "@/modals/User";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);

    const { currentPassword, newPassword, role } = body || {};

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { message: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }

    if (typeof role !== "undefined" && role !== session.user.role) {
      // Prevent changing admin password using employee UI (or vice versa)
      return NextResponse.json(
        { message: "Invalid role." },
        { status: 403 }
      );
    }

    await dbConnect();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Current password is incorrect." },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    user.password = hashed;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    // tokenVersion bump causes next-auth jwt callback to mark session expired on next check
    return NextResponse.json(
      { message: "Password updated successfully." },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    return NextResponse.json(
      { message: message || "Failed to update password." },
      { status: 500 }
    );
  }
}