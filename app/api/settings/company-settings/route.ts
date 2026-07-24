import { NextResponse } from "next/server";
import CompanyDetails from "@/modals/CompanyDetails";
import dbConnect from "@/lib/mongodb";
import { getAdminUser } from "@/lib/auth";

// 1. Prevent Next.js from caching GET requests statically
export const dynamic = "force-dynamic";

// GET: Retrieve company settings safely
export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

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
        autoCheckOutBuffer: 30,
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
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admin access required." }, { status: 403 });
    }

    await dbConnect();

    // 2. Safely parse request body
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
      autoCheckOutBuffer
    } = body;

    // Ensure autoCheckOutBuffer is a number between 0 and 30 minutes
    let bufferInMinutes = typeof autoCheckOutBuffer === "number" ? autoCheckOutBuffer : 30;
    if (bufferInMinutes > 30) bufferInMinutes = 30;
    if (bufferInMinutes < 0) bufferInMinutes = 0;

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
      autoCheckOut: Boolean(autoCheckOut),
      autoCheckOutBuffer: bufferInMinutes,
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

export async function PUT(request: Request) {
  return handleUpdate(request);
}

export async function POST(request: Request) {
  return handleUpdate(request);
}