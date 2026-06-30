import { Schema, model, models } from "mongoose";

const PayslipSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
  employeeName: { type: String }, // Snapshot of name at creation
  employeeRole: { type: String }, // Snapshot of title at creation
  period: { type: String, required: true },
  basicSalary: { type: Number, required: true },
  allowances: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  deductions: { type: Number, default: 0 },
  netPay: { type: Number, required: true },
  paymentMethod: { type: String },
  paymentDate: { type: Date },
}, { timestamps: true });

export const Payslip = models.Payslip || model("Payslip", PayslipSchema);