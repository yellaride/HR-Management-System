import { Schema, model, models } from "mongoose";

const LeaveBalanceSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },

    // Total allocated leave days for the employee.
    // Backend uses this to validate new leave requests.
    ANNUAL: {
      allocated: { type: Number, required: true, default: 0, min: 0 },
      used: { type: Number, required: true, default: 0, min: 0 },
    },

    SICK: {
      allocated: { type: Number, required: true, default: 0, min: 0 },
      used: { type: Number, required: true, default: 0, min: 0 },
    },

    CASUAL: {
      allocated: { type: Number, required: true, default: 0, min: 0 },
      used: { type: Number, required: true, default: 0, min: 0 },
    },
  },
  { timestamps: true }
);

const LeaveBalance = models.LeaveBalance || model("LeaveBalance", LeaveBalanceSchema);
export default LeaveBalance;