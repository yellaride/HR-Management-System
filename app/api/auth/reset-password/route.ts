import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/modals/User";
import PasswordResetToken from "@/modals/PasswordResetToken";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    
    // 1. Trim whitespace to avoid copying/email-parsing errors
    const token = searchParams.get("token")?.trim();
    const email = searchParams.get("email")?.trim();

    if (!token || !email) {
      return NextResponse.json({ valid: false, message: "Missing token or email params." }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ valid: false, message: "User not found." }, { status: 404 });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // 2. Query handles both ObjectId and String representations of userId
    const validTokenRecord = await PasswordResetToken.findOne({
      token: hashedToken,
      expiresAt: { $gt: new Date() },
      $or: [
        { userId: user._id },
        { userId: user._id.toString() }
      ]
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

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, token, newPassword } = await req.json();

    const cleanEmail = email?.trim();
    const cleanToken = token?.trim();

    if (!cleanEmail || !cleanToken || !newPassword) {
      return NextResponse.json({ message: "Required parameters are missing." }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters long." }, { status: 400 });
    }

    const user = await User.findOne({ email: cleanEmail.toLowerCase() });
    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const hashedToken = crypto.createHash("sha256").update(cleanToken).digest("hex");

    // Match query in POST to process actual password update
    const validTokenRecord = await PasswordResetToken.findOne({
      token: hashedToken,
      expiresAt: { $gt: new Date() },
      $or: [
        { userId: user._id },
        { userId: user._id.toString() }
      ]
    });

    if (!validTokenRecord) {
      return NextResponse.json({ message: "Invalid or expired reset token." }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    if (user.tokenVersion !== undefined) {
      user.tokenVersion += 1;
    }
    await user.save();

    // Remove tokens once completed
    await PasswordResetToken.deleteMany({ userId: user._id });

    return NextResponse.json({ message: "Password updated successfully." }, { status: 200 });
  } catch (error) {
    console.error("Password reset processing error:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}