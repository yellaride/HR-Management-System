import { Schema, model, models } from "mongoose";

const EmployeeSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: { type: String, required: true },

    // Back-compat: older code uses `jobTitle` (shown in UI as employee.role)
    jobTitle: { type: String },

    // New required fields requested by admin forms
    designation: { type: String, required: true },
    joinDate: { type: Date, required: true },

    department: { type: String, required: true },
    salary: { type: Number, required: true },
    status: { type: String, required: true, default: "Active" },

  },
  { timestamps: true }
);

export const Employee = models.Employee || model("Employee", EmployeeSchema);

