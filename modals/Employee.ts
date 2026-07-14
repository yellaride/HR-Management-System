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
    designation: { type: String, required: true },
    joinDate: { type: Date, required: true },
    department: { type: String, required: true },
    
    // Storing both base salary and calculated hourly rate
    salary: {
    type: Number,
    default: 0
  },
  hourlyRate: {
    type: Number,
    default: 0
  },

    status: { type: String, required: true, default: "Active" },
    employeeId: { type: String, default: "" },
    profilePhotoUrl: { type: String, default: "" },
    phoneNumber: { type: String, default: "" },
    address: { type: String, default: "" },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, default: "" },
    maritalStatus: { type: String, default: "" },
    emergencyContactName: { type: String, default: "" },
    emergencyContactPhone: { type: String, default: "" },
    birthdayVisibility: { 
      type: String, 
      enum: ["everyone", "admin", "hidden"], 
      default: "everyone" 
    },
    birthdayEmailStatus: { 
      type: String, 
      enum: ["Sent", "Scheduled", "Pending"], 
      default: "Pending" 
    },
  },
  { timestamps: true }
);

export const Employee = models.Employee || model("Employee", EmployeeSchema);