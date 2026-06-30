// app/api/test-db/route.ts (or your path to this API route)
import connectDB from "../../../lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ message: "MongoDB Connected Successfully" });
  } catch (error: any) {
    // 1. Logs the exact error details to your terminal/terminal console
    console.error("MongoDB Connection Error details:", error);

    // 2. Returns the error message to your API test tool/browser
    return NextResponse.json(
      { 
        message: "MongoDB Connection Failed", 
        error: error.message || error 
      },
      { status: 500 }
    );
  }
}