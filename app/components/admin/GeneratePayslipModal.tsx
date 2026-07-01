"use client";

import React, { useState, useEffect } from "react";
import { X, DollarSign, Calendar, CreditCard, User, AlertCircle } from "lucide-react";

export interface EmployeeOption {
  _id?: string;
  id?: string;        // Fallback in case backend translates _id to id
  name?: string;
  firstName?: string; // Fallback for split-name schemas
  lastName?: string;  // Fallback for split-name schemas
  jobTitle?: string;  
  role?: string;      // Fallback if named "role"
  department?: string;
  status?: string;
}

interface GeneratePayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees?: EmployeeOption[]; 
  isLoading?: boolean; // Prop to know if the parent is still fetching
  onSave: (data: {
    employeeId: string;
    period: string;
    basicSalary: number;
    allowances: number;
    deductions: number;
    bonus: number;
    netPay: number; // Added netPay to meet database requirements
    paymentMethod: string;
    paymentDate: string;
  }) => void;
}

// Safely gets local YYYY-MM-DD format without UTC timezone offsets
const getLocalTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDefaultPeriod = () => {
  const now = new Date();
  const monthName = now.toLocaleString("default", { month: "long" });
  const year = now.getFullYear();
  return `${monthName} ${year}`;
};

export default function GeneratePayslipModal({
  isOpen,
  onClose,
  employees = [],
  isLoading = false,
  onSave,
}: GeneratePayslipModalProps) {
  const [formData, setFormData] = useState({
    employeeId: "",
    jobTitle: "",
    period: "",
    basicSalary: 0,
    allowances: 0,
    deductions: 0,
    bonus: 0,
    paymentMethod: "Bank Transfer",
    paymentDate: "",
  });

  const [validationError, setValidationError] = useState("");

  // Diagnostic log to track passed data in DevTools
  useEffect(() => {
    if (isOpen) {
      console.log("GeneratePayslipModal received employees list:", employees);
    }
  }, [isOpen, employees]);

  useEffect(() => {
    if (isOpen) {
      // Use functional update to avoid setState-in-effect lint issue
      setFormData((prev) => ({
        ...prev,
        employeeId: "",
        jobTitle: "",
        period: getDefaultPeriod(),
        basicSalary: 0,
        allowances: 0,
        deductions: 0,
        bonus: 0,
        paymentMethod: "Bank Transfer",
        paymentDate: getLocalTodayDateString(),
      }));
      setValidationError(""); // Reset any prior validation errors
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Safe selection matcher supporting both _id and id structures
  const handleEmployeeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedEmployee = (employees || []).find((emp) => {
      if (!emp) return false;
      const empId = emp._id?.toString() || emp.id?.toString() || "";
      return empId === selectedId;
    });

    // Combines Job Title and Role (e.g., "Designer / Employee")
    let combinedJobTitle = "";
    if (selectedEmployee) {
      const title = (selectedEmployee.jobTitle || "").trim();
      const role = (selectedEmployee.role || "").trim();

      if (title && role && title.toLowerCase() !== role.toLowerCase()) {
        combinedJobTitle = `${title} / ${role}`;
      } else {
        combinedJobTitle = title || role || "No Specified Title";
      }
    }

    setFormData((prev) => ({
      ...prev,
      employeeId: selectedId,
      jobTitle: combinedJobTitle,
    }));
    setValidationError(""); // Reset error once an option is selected
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      // Prevents negative values in financial numbers
      [name]: type === "number" 
        ? (value === "" ? 0 : Math.max(0, Number(value))) 
        : value,
    }));
  };

  const netPay =
    formData.basicSalary +
    formData.allowances +
    formData.bonus -
    formData.deductions;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Visual Validation warnings rather than silent failure
    if (!formData.employeeId) {
      setValidationError("Please select an employee.");
      return;
    }
    if (formData.basicSalary <= 0) {
      setValidationError("Basic Salary must be greater than $0 to record payment.");
      return;
    }

    setValidationError("");

    onSave({
      employeeId: formData.employeeId,
      period: formData.period,
      basicSalary: formData.basicSalary,
      allowances: formData.allowances,
      deductions: formData.deductions,
      bonus: formData.bonus,
      netPay: netPay, // Submit calculation to database endpoint
      paymentMethod: formData.paymentMethod,
      paymentDate: formData.paymentDate,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-950">
              Generate Payslip
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Record and issue a salary statement entry linked to an employee.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          
          {/* Validation Alert Box */}
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4.5 h-4.5 text-red-500" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Section: Employee Selection & Pay Period */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Select Employee
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <select
                  name="employeeId"
                  required
                  value={formData.employeeId}
                  onChange={handleEmployeeSelect}
                  className="w-full pl-9 pr-3 py-2 bg-[var(--color-surface-card)] border border-[var(--color-line-subtle)] rounded-xl text-xs text-[var(--color-content-main)] hover:border-[var(--color-brand-accent)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-accent)]/25 focus:border-[var(--color-brand-accent)] transition cursor-pointer appearance-none"
                >
                  <option value="" disabled>
                    {isLoading 
                      ? "Loading employees..." 
                      : (employees || []).length === 0 
                        ? "No employees found" 
                        : "Select an employee..."}
                  </option>
                  {(employees || []).map((emp) => {
                    if (!emp) return null;
                    const empId = emp._id?.toString() || emp.id?.toString() || "";
                    
                    // Fallback to construct full name if name field is split
                    const baseName = emp.name || `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || "Unnamed Employee";
                    
                    // Display status alongside name if they aren't "Active"
                    const isInactive = emp.status && emp.status.toLowerCase() !== "active";
                    const displayLabel = isInactive ? `${baseName} (${emp.status})` : baseName;

                    return (
                      <option key={empId} value={empId}>
                        {displayLabel}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Job Title / Role
              </label>
              <input
                type="text"
                name="jobTitle"
                disabled
                placeholder="Auto-populated"
                value={formData.jobTitle}
                className="form-input disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Pay Period
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </span>
                  <input
                  type="text"
                  name="period"
                  required
                  placeholder="e.g. June 2026"
                  value={formData.period}
                  onChange={handleChange}
                  className="form-input-with-icon"
                />
              </div>
            </div>
          </div>

          {/* Section: Transaction Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Payment Method
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <CreditCard className="w-4 h-4" />
                </span>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2 bg-[var(--color-surface-card)] border border-[var(--color-line-subtle)] rounded-xl text-xs text-[var(--color-content-main)] hover:border-[var(--color-brand-accent)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-accent)]/25 focus:border-[var(--color-brand-accent)] transition cursor-pointer appearance-none"
                >
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Direct Deposit">Direct Deposit</option>
                  <option value="Check">Check</option>
                  <option value="PayPal">PayPal</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Payment Date
              </label>
                <input
                type="date"
                name="paymentDate"
                required
                value={formData.paymentDate}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          {/* Section: Financial Calculations */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-200/60 pb-1.5">
              Financial Breakdown ($)
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500">
                  Basic Salary
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                    <DollarSign className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="number"
                    name="basicSalary"
                    required
                    min={1}
                    value={formData.basicSalary || ""}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-1.5 bg-[var(--color-surface-card)] border border-[var(--color-line-subtle)] rounded-lg text-xs text-[var(--color-content-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-accent)]/25 focus:border-[var(--color-brand-accent)] transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500">
                  Allowances
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                    <DollarSign className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="number"
                    name="allowances"
                    min={0}
                    value={formData.allowances || ""}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-1.5 bg-[var(--color-surface-card)] border border-[var(--color-line-subtle)] rounded-lg text-xs text-[var(--color-content-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-accent)]/25 focus:border-[var(--color-brand-accent)] transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500">
                  Bonus
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                    <DollarSign className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="number"
                    name="bonus"
                    min={0}
                    value={formData.bonus || ""}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-1.5 bg-[var(--color-surface-card)] border border-[var(--color-line-subtle)] rounded-lg text-xs text-[var(--color-content-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-accent)]/25 focus:border-[var(--color-brand-accent)] transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500">
                  Deductions
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                    <DollarSign className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="number"
                    name="deductions"
                    min={0}
                    value={formData.deductions || ""}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full pl-7 pr-3 py-1.5 bg-[var(--color-surface-card)] border border-[var(--color-line-subtle)] rounded-lg text-xs text-[var(--color-content-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-accent)]/25 focus:border-[var(--color-brand-accent)] transition"
                  />
                </div>
              </div>
            </div>

            {/* Live Net Calculation Preview */}
            <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--color-content-secondary)]">
                Calculated Net Pay:
              </span>
              <span className="font-bold text-[var(--color-brand-accent)] bg-[var(--color-brand-subtle)] border border-[var(--color-brand-subtle)] px-2.5 py-1 rounded-lg">
                $
                {netPay.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end items-center gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-hover)] rounded-xl shadow-md transition"
            >
              Issue Payment Receipt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}