import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import User from "@/modals/User";
import PasswordResetToken from "@/modals/PasswordResetToken";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      return NextResponse.json({ valid: false, message: "Missing token or email params." }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ valid: false, message: "User not found." }, { status: 404 });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Check if valid token matches in MongoDB and is not expired
    const validTokenRecord = await PasswordResetToken.findOne({
      userId: user._id,
      token: hashedToken,
      expiresAt: { $gt: new Date() },
    });

    if (!validTokenRecord) {
      return NextResponse.json({ valid: false, message: "Token is invalid or has expired." }, { status: 400 });
    }

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error("Token verification processing error:", error);
    return NextResponse.json({ valid: false, message: "Server error." }, { status: 500 });
  }
}