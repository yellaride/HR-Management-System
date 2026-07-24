import { Schema, model, models } from "mongoose";

const CompanyDetailsSchema = new Schema(
  {
    companyName: { type: String, default: "" },
    location: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    standardWorkingHours: { type: Number, required: true, default: 160 },
    departments: { type: [String], default: [] },
    // Shift parameters
    shiftStart: { type: String, default: "09:00" },
    shiftEnd: { type: String, default: "17:00" },
    gracePeriod: { type: Number, default: 15 },
    // persistent visibility and automation parameters
    checkInDisplayBefore: { type: Number, default: 30 }, // Minutes before shiftStart to show button
    checkOutDisplayAfter: { type: Number, default: 0 },  // Minutes after shiftEnd to show button
    autoCheckOut: { type: Boolean, default: false },    // Is Auto Check-out active (checkbox)
    autoCheckOutBuffer: { type: Number, default: 30, min: 0, max: 30 }, // Buffer in minutes (max 30)
  },
  {
    timestamps: true,
  }
);

const CompanyDetails = models.CompanyDetails || model("CompanyDetails", CompanyDetailsSchema);

export default CompanyDetails;