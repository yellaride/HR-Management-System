import mongoose, { Schema, Document, Model } from "mongoose";

export interface IEmployeeLeavePolicy extends Document {
  userId: string;
  ANNUAL: number;
  SICK: number;
  CASUAL: number;
  MONTHLY: number; // 2 leaves allowed per month
  createdAt?: Date;
  updatedAt?: Date;
}

const EmployeeLeavePolicySchema = new Schema<IEmployeeLeavePolicy>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
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
    MONTHLY: {
      type: Number,
      required: true,
      min: [0, "Monthly leaves cannot be negative"],
      default: 2, // Default limit of 2 leaves per month
    },
  },
  {
    timestamps: true,
  }
);

const EmployeeLeavePolicy: Model<IEmployeeLeavePolicy> =
  mongoose.models.EmployeeLeavePolicy ||
  mongoose.model<IEmployeeLeavePolicy>("EmployeeLeavePolicy", EmployeeLeavePolicySchema);

export default EmployeeLeavePolicy;