import { Schema, model, models } from "mongoose";

const EmployeeSchema = new Schema(
  {
    // Linked authentication document
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // Employment fields (admin-managed)
    name: { type: String, required: true },

    // Back-compat: older code uses `jobTitle` (shown in UI as employee.role)

    designation: { type: String, required: true },
    joinDate: { type: Date, required: true },

    department: { type: String, required: true },
    salary: { type: Number, required: true },
    status: { type: String, required: true, default: "Active" },

    // Employee self-service profile fields
    employeeId: { type: String, default: "" },
    profilePhotoUrl: { type: String, default: "" },

    phoneNumber: { type: String, default: "" },
    address: { type: String, default: "" },
    dateOfBirth: { type: Date, default: null },

    gender: { type: String, default: "" },
    maritalStatus: { type: String, default: "" },

    emergencyContactName: { type: String, default: "" },
    emergencyContactPhone: { type: String, default: "" },
  },
  { timestamps: true }
);


export const Employee = models.Employee || model("Employee", EmployeeSchema);

