import { Schema, model, models } from "mongoose";

const EmployeeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true },
    jobTitle: { type: String, required: true }, // Saved from form's "role" state (e.g., "Frontend Engineer")
    department: { type: String, required: true },
    status: { type: String, required: true, default: "Active" },
  },
  { timestamps: true }
);

export const Employee = models.Employee || model("Employee", EmployeeSchema);