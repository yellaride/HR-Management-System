import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMonthlyAttendance extends Document {
  userId: string;
  year: number;
  month: number; // 1-12
  totalWorkingHours: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  onDutyDays: number;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MonthlyAttendanceSchema = new Schema<IMonthlyAttendance>(
  {
    userId: { type: String, required: true, index: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    totalWorkingHours: { type: Number, default: 0 },
    presentDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    leaveDays: { type: Number, default: 0 },
    onDutyDays: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Ensure there is only one unique monthly record per user per month
MonthlyAttendanceSchema.index({ userId: 1, year: 1, month: 1 }, { unique: true });

export const MonthlyAttendance: Model<IMonthlyAttendance> = 
  mongoose.models.MonthlyAttendance || mongoose.model<IMonthlyAttendance>("MonthlyAttendance", MonthlyAttendanceSchema);