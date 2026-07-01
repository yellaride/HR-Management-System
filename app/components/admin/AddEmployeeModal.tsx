"use client";

import React, { useState, useEffect } from "react";
import PasswordInputWithToggle from "../PasswordInputWithToggle";

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage?: string | null;
  onSave: (data: {
    name: string;
    email: string;
    password: string;
    department: string;
    status: string;
    designation: string;
    role: "employee" | "admin";
    salary: number;
    joinDate: string;
  }) => void;
}

export default function AddEmployeeModal({ isOpen, onClose, onSave, errorMessage }: AddEmployeeModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "Engineering",
    designation: "",
    role: "employee" as "employee" | "admin",
    salary: "" as string | number,
    joinDate: "",
    status: "Active",
  });

  // Local state for field-specific errors and general alerts
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Sync backend errors into local form state
  useEffect(() => {
    if (errorMessage) {
      setGeneralError(errorMessage);
      
      // If the backend error indicates an issue with the email, highlight the email field specifically
      if (errorMessage.toLowerCase().includes("email")) {
        setErrors((prev) => ({
          ...prev,
          email: "This email address is already registered.",
        }));
      }
    }
  }, [errorMessage]);

  // Clean and reset states when the modal is closed
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        email: "",
        password: "",
        department: "Engineering",
        designation: "",
        role: "employee",
        salary: "",
        joinDate: "",
        status: "Active",
      });
      setErrors({});
      setGeneralError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handles input updating and clears error indicators dynamically as the user types
  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors((prev) => {
        const nextErrors = { ...prev };
        delete nextErrors[field];
        return nextErrors;
      });
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  // Perform local form validation
  const validateForm = (): boolean => {
    const tempErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      tempErrors.name = "Full name is required";
    }
    if (!formData.email.trim()) {
      tempErrors.email = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      tempErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters long";
    }
    if (!formData.designation.trim()) {
      tempErrors.designation = "Designation is required";
    }
    if (!formData.joinDate) {
      tempErrors.joinDate = "Join date is required";
    }
    
    const salaryNum = Number(formData.salary);
    if (formData.salary === "" || isNaN(salaryNum) || salaryNum < 0) {
      tempErrors.salary = "Please specify a valid positive salary amount";
    }

    setErrors(tempErrors);

    if (Object.keys(tempErrors).length > 0) {
      setGeneralError("Please correct the highlighted errors before saving.");
      return false;
    }

    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    onSave({
      name: formData.name.trim(),
      email: formData.email.trim(),
      password: formData.password,
      department: formData.department,
      status: formData.status,
      designation: formData.designation.trim(),
      role: formData.role,
      salary: Number(formData.salary) || 0,
      joinDate: formData.joinDate,
    });
    // handleClose is removed from here. The parent is responsible for closing the modal on success.
  };

  const handleClose = () => {
    onClose();
  };

  // Shared dynamic class generation for input fields based on validation state
  const getInputClass = (fieldName: string) => {
    const baseClass = "w-full px-3 py-2 bg-slate-50/50 border rounded-lg text-xs text-slate-800 placeholder-slate-400 outline-none transition-all duration-150";
    const normalClass = "border-slate-200 hover:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500";
    const errorClass = "border-rose-300 bg-rose-50/10 text-rose-900 hover:border-rose-400 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500";
    
    return `${baseClass} ${errors[fieldName] ? errorClass : normalClass}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      
      {/* Dark backdrop overlay with slight blur */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={handleClose} 
      />

      {/* White Modal Container */}
      <div className="relative bg-white border border-slate-100 rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Subtle purple accent line at the top */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 to-purple-700" />
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900">Add New Employee</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">Fill in the fields below to register a new profile in the organization.</p>
          </div>
          <button 
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Form Wrap */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 -mr-1 mt-4 space-y-4">
          
          {/* Attractive Inline Error Alert Bar (Only shows when needed) */}
          {(generalError || errorMessage) && (
            <div className="flex items-start gap-3 p-3.5 bg-rose-50/75 border border-rose-100 rounded-xl text-rose-800 animate-in fade-in slide-in-from-top-1 duration-200">
              <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="text-xs font-semibold">
                  {errorMessage && !generalError ? "Submission Error" : "Validation Notice"}
                </h4>
                <p className="text-[11px] text-rose-600/90 mt-0.5">{generalError || errorMessage}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
            
            {/* Full Name */}
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Liam Parker"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={getInputClass("name")}
              />
              {errors.name && (
                <p className="text-[10px] text-rose-500 font-medium">{errors.name}</p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@company.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={getInputClass("email")}
              />
              {errors.email && (
                <p className="text-[10px] text-rose-500 font-medium">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <PasswordInputWithToggle
                label="Temp Password"
                value={formData.password}
                onChange={(next) => handleInputChange("password", next)}
                placeholder="Minimum 6 characters"
                inputClassName={getInputClass("password")}
              />
              {errors.password && (
                <p className="text-[10px] text-rose-500 font-medium">{errors.password}</p>
              )}
            </div>

            {/* Designation */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Designation
              </label>
              <input
                type="text"
                placeholder="e.g. Frontend Engineer"
                value={formData.designation}
                onChange={(e) => handleInputChange("designation", e.target.value)}
                className={getInputClass("designation")}
              />
              {errors.designation && (
                <p className="text-[10px] text-rose-500 font-medium">{errors.designation}</p>
              )}
            </div>

            {/* Department Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => handleInputChange("department", e.target.value)}
                className={getInputClass("department") + " cursor-pointer"}
              >
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Operations">Operations</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            {/* Salary */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Salary ($)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="e.g. 5000"
                value={formData.salary}
                onChange={(e) => handleInputChange("salary", e.target.value)}
                className={getInputClass("salary")}
              />
              {errors.salary && (
                <p className="text-[10px] text-rose-500 font-medium">{errors.salary}</p>
              )}
            </div>

            {/* Join Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Join Date
              </label>
              <input
                type="date"
                value={formData.joinDate}
                onChange={(e) => handleInputChange("joinDate", e.target.value)}
                className={getInputClass("joinDate") + " cursor-pointer"}
              />
              {errors.joinDate && (
                <p className="text-[10px] text-rose-500 font-medium">{errors.joinDate}</p>
              )}
            </div>

            {/* Access Role */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Access Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
                className={getInputClass("role") + " cursor-pointer"}
              >
                <option value="employee">Employee</option>
                <option value="admin">HR Admin</option>
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Initial Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className={getInputClass("status") + " cursor-pointer"}
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>

          </div>

          {/* Actions Bottom Bar */}
          <div className="flex justify-end items-center gap-2 pt-4 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-700 rounded-lg border border-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm hover:shadow-purple-100 transition duration-150 active:scale-[0.98]"
            >
              Create Profile
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}