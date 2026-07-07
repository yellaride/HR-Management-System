import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActivityLog extends Document {
  userId: string;
  activityType: "CHECK_IN" | "CHECK_OUT" | "LEAVE_REQUEST" | "LEAVE_APPROVED" | "LEAVE_REJECTED";
  date: string; // YYYY-MM-DD format for easy daily queries
  timestamp: Date; // Actual instant of the action
  description: string; // E.g., "Checked in (Late) at 12:45 PM"
  metadata?: {
    attendanceId?: mongoose.Types.ObjectId | string;
    leaveId?: mongoose.Types.ObjectId | string;
    status?: string; // "Late", "On Time", "Approved", "Rejected"
    workingHours?: number;
    leaveType?: string; // "ANNUAL", "SICK", "CASUAL"
    days?: number;
  };
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    userId: { type: String, required: true, index: true },
    activityType: {
      type: String,
      required: true,
      enum: ["CHECK_IN", "CHECK_OUT", "LEAVE_REQUEST", "LEAVE_APPROVED", "LEAVE_REJECTED"],
    },
    date: { type: String, required: true, index: true }, // Format: YYYY-MM-DD
    timestamp: { type: Date, default: Date.now },
    description: { type: String, required: true },
    metadata: {
      attendanceId: { type: Schema.Types.ObjectId, ref: "Attendance" },
      leaveId: { type: Schema.Types.ObjectId, ref: "Leave" },
      status: { type: String },
      workingHours: { type: Number },
      leaveType: { type: String },
      days: { type: Number },
    },
  },
  { timestamps: true }
);

// Compound index to quickly fetch history for a specific user ordered by time
ActivityLogSchema.index({ userId: 1, timestamp: -1 });

export const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog || mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);