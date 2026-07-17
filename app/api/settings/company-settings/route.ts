import { NextResponse } from "next/server";
import mongoose from "mongoose";
import CompanyDetails from "@/modals/CompanyDetails"; // Verify if this should be "@/models/CompanyDetails"

// 1. Prevent Next.js from caching GET requests statically
export const dynamic = "force-dynamic";

// Helper function to ensure database connection
async function dbConnect() {
  if (mongoose.connection.readyState >= 1) return;
  
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined in your environment variables.");
  }
  
  await mongoose.connect(process.env.MONGODB_URI);
}

// GET: Retrieve company settings safely
export async function GET() {
  try {
    await dbConnect();
    
    let settings = await CompanyDetails.findOne();
    
    if (!settings) {
      settings = {
        companyName: "",
        location: "",
        phone: "",
        email: "",
        standardWorkingHours: 160,
        departments: [],
        shiftStart: "09:00",
        shiftEnd: "17:00",
        gracePeriod: 15,
        checkInDisplayBefore: 30,
        checkOutDisplayAfter: 0,
        autoCheckOut: false,
        autoCheckOutTime: "18:00",
      };
    }

    return NextResponse.json(settings);
  } catch (error: unknown) {
    console.error("GET API Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Internal Server Error: " + errorMessage },
      { status: 500 }
    );
  }
}

// Unified Update Handler (Shared by PUT and POST methods)
async function handleUpdate(request: Request) {
  try {
    await dbConnect();

    // 2. Safely parse request body to avoid crashing on empty payloads
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON format or empty request payload." },
        { status: 400 }
      );
    }

    const { 
      companyName, 
      location, 
      phone, 
      email, 
      standardWorkingHours,
      departments,
      shiftStart,
      shiftEnd,
      gracePeriod,
      checkInDisplayBefore,
      checkOutDisplayAfter,
      autoCheckOut,
      autoCheckOutTime
    } = body;

    // Find the singular active settings document
    const existing = await CompanyDetails.findOne();

    // Map fields carefully and apply fallback defaults
    const payload = {
      companyName: companyName ?? "",
      location: location ?? "",
      phone: phone ?? "",
      email: email ?? "",
      standardWorkingHours: typeof standardWorkingHours === "number" ? standardWorkingHours : 160,
      departments: Array.isArray(departments) ? departments : [],
      shiftStart: shiftStart || "09:00",
      shiftEnd: shiftEnd || "17:00",
      gracePeriod: typeof gracePeriod === "number" ? gracePeriod : 15,
      checkInDisplayBefore: typeof checkInDisplayBefore === "number" ? checkInDisplayBefore : 30,
      checkOutDisplayAfter: typeof checkOutDisplayAfter === "number" ? checkOutDisplayAfter : 0,
      autoCheckOut: typeof autoCheckOut === "boolean" ? autoCheckOut : false,
      autoCheckOutTime: autoCheckOutTime || "18:00",
    };

    let result;
    if (!existing) {
      // Create if first time
      result = await CompanyDetails.create(payload);
    } else {
      // Update the existing document
      result = await CompanyDetails.findByIdAndUpdate(
        existing._id,
        payload,
        { new: true, runValidators: true }
      );
    }

    console.log("[company-settings] saved result:", {
      _id: result?._id,
      departments: result?.departments,
      shiftStart: result?.shiftStart,
      shiftEnd: result?.shiftEnd,
      gracePeriod: result?.gracePeriod,
      checkInDisplayBefore: result?.checkInDisplayBefore,
      checkOutDisplayAfter: result?.checkOutDisplayAfter,
      autoCheckOut: result?.autoCheckOut,
      autoCheckOutTime: result?.autoCheckOutTime,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Write API Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to persist database changes: " + errorMessage },
      { status: 500 }
    );
  }
}

// 3. Support both HTTP PUT and POST methods to bypass client configuration errors
export async function PUT(request: Request) {
  return handleUpdate(request);
}

export async function POST(request: Request) {
  return handleUpdate(request);
}