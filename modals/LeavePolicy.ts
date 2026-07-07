import mongoose, { Schema, Document, Model } from "mongoose";

// Define TypeScript interface for the document
export interface ILeavePolicy extends Document {
  key: string;
  ANNUAL: number;
  SICK: number;
  CASUAL: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const LeavePolicySchema = new Schema<ILeavePolicy>(
  {
    key: {
      type: String,
      required: true,
      unique: true, // Ensures only one document with a specific key exists
      default: "default",
    },
    ANNUAL: {
      type: Number,
      required: true,
      min: [0, "Annual leaves cannot be negative"],
      default: 15,
    },
    SICK: {
      type: Number,
      required: true,
      min: [0, "Sick leaves cannot be negative"],
      default: 8,
    },
    CASUAL: {
      type: Number,
      required: true,
      min: [0, "Casual leaves cannot be negative"],
      default: 6,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Prevent compiling model multiple times in Next.js development environment
const LeavePolicy: Model<ILeavePolicy> =
  mongoose.models.LeavePolicy || mongoose.model<ILeavePolicy>("LeavePolicy", LeavePolicySchema);

export default LeavePolicy;