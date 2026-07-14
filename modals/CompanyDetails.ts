import { Schema, model, models } from "mongoose";

const CompanyDetailsSchema = new Schema(
  {
    companyName: { type: String, default: "" },
    location: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    standardWorkingHours: { type: Number, required: true, default: 160 },
  },
  {
    timestamps: true,
  }
);

// Corrected the schema reference to CompanyDetailsSchema 
// and aligned the model name to "CompanyDetails"
const CompanyDetails = models.CompanyDetails || model("CompanyDetails", CompanyDetailsSchema);

export default CompanyDetails;