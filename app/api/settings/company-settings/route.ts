import { NextResponse } from "next/server";
import mongoose from "mongoose";
import CompanyDetails from "@/modals/CompanyDetails"; // Adjust this path to match where your model is saved

// Helper function to ensure database connection
async function dbConnect() {
  if (mongoose.connection.readyState >= 1) return;
  
  if (!process.env.MONGODB_URI) {
    throw new Error("Please add your MONGODB_URI to your .env file");
  }
  
  await mongoose.connect(process.env.MONGODB_URI);
}

// GET: Retrieve company settings
export async function GET() {
  try {
    await dbConnect();
    
    // Find the first document in the collection
    let settings = await CompanyDetails.findOne();
    
    // If no configuration exists in the database yet, 
    // return a default structure instead of crashing or returning null.
    if (!settings) {
      settings = {
        companyName: "",
        location: "",
        phone: "",
        email: "",
        standardWorkingHours: 160,
      };
    }

    return NextResponse.json(settings);
  } catch (error: any) {

    console.error("GET API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error: " + error.message },
      { status: 500 }
    );
  }
}

// PUT: Update or create company settings
export async function PUT(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { companyName, location, phone, email, standardWorkingHours } = body;


    // Ensure we update the same document that GET returns.
    // This avoids cases where multiple documents exist and `{}` updates the wrong one.
    const existing = await CompanyDetails.findOne();

    const payload = {
      companyName,
      location,
      phone,
      email,
      standardWorkingHours: typeof standardWorkingHours === "number" ? standardWorkingHours : 160,
    };

    if (!existing) {
      const created = await CompanyDetails.create(payload);
      return NextResponse.json(created);
    }

    const updatedSettings = await CompanyDetails.findByIdAndUpdate(
      existing._id,
      payload,
      { new: true }
    );




    return NextResponse.json(updatedSettings);
  } catch (error: any) {
    console.error("PUT API Error:", error);
    return NextResponse.json(
      { error: "Failed to update system settings: " + error.message },
      { status: 500 }
    );
  }
}