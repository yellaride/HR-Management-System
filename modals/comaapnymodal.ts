import mongoose from "mongoose";

const CompanySettingsSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, "Company Name is required"],
      trim: true,
      default: "Enterprise Solutions Ltd",
    },
    location: {
      type: String,
      trim: true,
      default: "Lahore, Pakistan",
    },
    phone: {
      type: String,
      trim: true,
      default: "+92 42 111 222 333",
    },
  },
  { timestamps: true }
);

export default mongoose.models.CompanySettings || 
  mongoose.model("CompanySettings", CompanySettingsSchema);