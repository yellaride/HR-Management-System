import { Schema, model, models } from "mongoose";

const LeaveBalanceSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },

    // Added customPolicy flag (defaults to false)
    customPolicy: { type: Boolean, required: true, default: false },

    ANNUAL: {
      allocated: { type: Number, required: true, default: 15, min: 0 }, // Changed default to 15 to align with standard API baselines
      used: { type: Number, required: true, default: 0, min: 0 },
    },

    SICK: {
      allocated: { type: Number, required: true, default: 8, min: 0 },
      used: { type: Number, required: true, default: 0, min: 0 },
    },

    CASUAL: {
      allocated: { type: Number, required: true, default: 6, min: 0 },
      used: { type: Number, required: true, default: 0, min: 0 },
    },

    MONTHLY: {
      allocated: { type: Number, required: true, default: 2, min: 0 },
      used: { type: Number, required: true, default: 0, min: 0 },
    },
  },
  { timestamps: true }
);

const LeaveBalance = models.LeaveBalance || model("LeaveBalance", LeaveBalanceSchema);
export default LeaveBalance;