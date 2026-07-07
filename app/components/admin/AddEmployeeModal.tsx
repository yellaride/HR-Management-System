"use client";

import React, { useState, useEffect, useRef } from "react";
import PasswordInputWithToggle from "../PasswordInputWithToggle";
import { X, ChevronDown, AlertTriangle } from "lucide-react";

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

const DEPARTMENTS = ["Engineering", "Design", "Operations", "Marketing"];
const ROLES = [
  { value: "employee" as const, label: "Employee" },
  { value: "admin" as const, label: "HR Admin" },
];
const STATUSES = ["Active", "On Leave"];

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

  // State to handle custom, styled dropdown visibility
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  // Refs for click outside detection
  const deptRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Local state for field-specific errors and general alerts
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Global click-outside listener to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      
      if (deptRef.current && !deptRef.current.contains(target)) {
        setIsDeptOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(target)) {
        setIsRoleOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(target)) {
        setIsStatusOpen(false);
      }
    }

    if (isDeptOpen || isRoleOpen || isStatusOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDeptOpen, isRoleOpen, isStatusOpen]);

  // Sync backend errors into local form state
  useEffect(() => {
    if (errorMessage) {
      setGeneralError(errorMessage);
      
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
      setIsDeptOpen(false);
      setIsRoleOpen(false);
      setIsStatusOpen(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handles input updating and clears error indicators dynamically
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
  };

  const handleClose = () => {
    onClose();
  };

  // Shared dynamic class generation for input fields based on global styles
  const getInputClass = (fieldName: string) => {
    const baseClass = "w-full px-3.5 py-2.5 bg-[var(--color-surface-card)] border rounded-xl text-xs text-[var(--color-content-main)] placeholder-[var(--color-content-muted)] transition-all duration-200 shadow-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed";
    const normalClass = "border-[var(--color-line-subtle)] hover:border-[var(--color-brand-accent)]/50 focus:ring-2 focus:ring-[var(--color-brand-accent)]/20 focus:border-[var(--color-brand-accent)]";
    const errorClass = "border-rose-300 bg-rose-50/10 text-rose-900 hover:border-rose-400 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500";
    
    return `${baseClass} ${errors[fieldName] ? errorClass : normalClass}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">

      {/* Dark backdrop overlay with slight blur */}
      <div 
        className="absolute inset-0 bg-slate-900/35 backdrop-blur-xs transition-opacity z-10" 
        onClick={handleClose} 
      />

      {/* White Modal Container */}
      <div className="relative bg-[var(--color-surface-card)] border border-[var(--color-line-subtle)] rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Subtle purple accent line at the top */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[var(--color-brand-accent)] to-[var(--color-brand-hover)]" />
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[var(--color-line-subtle)] shrink-0">
          <div>
            <h2 className="text-base font-extrabold text-[var(--color-content-main)] tracking-tight">Add New Employee</h2>
            <p className="text-[11px] text-[var(--color-content-secondary)] mt-0.5 font-medium">Fill in the fields below to register a new profile in the organization.</p>
          </div>
          <button 
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-[var(--color-content-muted)] hover:text-[var(--color-brand-accent)] hover:bg-[var(--color-brand-subtle)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Wrap */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 -mr-1 mt-4 space-y-4">
          
          {/* Attractive Inline Error Alert Bar (Only shows when needed) */}
          {(generalError || errorMessage) && (
            <div className="flex items-start gap-3 p-3.5 bg-rose-50/75 border border-rose-100 rounded-xl text-rose-800 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold">
                  {errorMessage && !generalError ? "Submission Error" : "Validation Notice"}
                </h4>
                <p className="text-[11px] text-rose-600/90 mt-0.5 font-medium">{generalError || errorMessage}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
            
            {/* Full Name */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-content-muted)] block">
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
                <p className="text-[10px] text-rose-500 font-semibold">{errors.name}</p>
              )}
            </div>

            {/* Email Address */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-content-muted)] block">
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
                <p className="text-[10px] text-rose-500 font-semibold">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <PasswordInputWithToggle
                label="Temp Password"
                value={formData.password}
                onChange={(next) => handleInputChange("password", next)}
                placeholder="Minimum 6 characters"
                inputClassName={getInputClass("password")}
              />
              {errors.password && (
                <p className="text-[10px] text-rose-500 font-semibold">{errors.password}</p>
              )}
            </div>

            {/* Designation */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-content-muted)] block">
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
                <p className="text-[10px] text-rose-500 font-semibold">{errors.designation}</p>
              )}
            </div>

            {/* Custom Styled Department Dropdown */}
            <div className="space-y-1.5 relative" ref={deptRef}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-content-muted)] block">
                Department
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsDeptOpen(!isDeptOpen);
                  setIsRoleOpen(false);
                  setIsStatusOpen(false);
                }}
                className={`${getInputClass("department")} flex items-center justify-between text-left cursor-pointer z-40 relative`}
              >
                <span>{formData.department}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[var(--color-content-muted)] transition-transform duration-200 ${isDeptOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isDeptOpen && (
                <div className="dropdown-panel absolute left-0 right-0 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  {DEPARTMENTS.map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => {
                        handleInputChange("department", dept);
                        setIsDeptOpen(false);
                      }}
                      className={`dropdown-option ${
                        formData.department === dept ? "dropdown-option-active" : ""
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Salary */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-content-muted)] block">
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
                <p className="text-[10px] text-rose-500 font-semibold">{errors.salary}</p>
              )}
            </div>

            {/* Join Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-content-muted)] block">
                Join Date
              </label>
              <input
                type="date"
                value={formData.joinDate}
                onChange={(e) => handleInputChange("joinDate", e.target.value)}
                className={`${getInputClass("joinDate")} cursor-pointer`}
              />
              {errors.joinDate && (
                <p className="text-[10px] text-rose-500 font-semibold">{errors.joinDate}</p>
              )}
            </div>

            {/* Custom Styled Access Role Dropdown */}
            <div className="space-y-1.5 relative" ref={roleRef}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-content-muted)] block">
                Access Role
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsRoleOpen(!isRoleOpen);
                  setIsDeptOpen(false);
                  setIsStatusOpen(false);
                }}
                className={`${getInputClass("role")} flex items-center justify-between text-left cursor-pointer z-40 relative`}
              >
                <span>{ROLES.find(r => r.value === formData.role)?.label || "Employee"}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[var(--color-content-muted)] transition-transform duration-200 ${isRoleOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isRoleOpen && (
                <div className="dropdown-panel absolute left-0 right-0 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  {ROLES.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => {
                        handleInputChange("role", role.value);
                        setIsRoleOpen(false);
                      }}
                      className={`dropdown-option ${
                        formData.role === role.value ? "dropdown-option-active" : ""
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Styled Status Dropdown */}
            <div className="space-y-1.5 relative" ref={statusRef}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-content-muted)] block">
                Initial Status
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsStatusOpen(!isStatusOpen);
                  setIsDeptOpen(false);
                  setIsRoleOpen(false);
                }}
                className={`${getInputClass("status")} flex items-center justify-between text-left cursor-pointer z-40 relative`}
              >
                <span>{formData.status}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[var(--color-content-muted)] transition-transform duration-200 ${isStatusOpen ? "rotate-180" : ""}`} />
              </button>
              
              {isStatusOpen && (
                <div className="dropdown-panel absolute left-0 right-0 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  {STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => {
                        handleInputChange("status", status);
                        setIsStatusOpen(false);
                      }}
                      className={`dropdown-option ${
                        formData.status === status ? "dropdown-option-active" : ""
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Actions Bottom Bar */}
          <div className="flex justify-end items-center gap-2 pt-4 border-t border-[var(--color-line-subtle)] shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-4.5 py-2.5 text-xs font-bold text-[var(--color-content-secondary)] bg-[var(--color-surface-main)] hover:bg-[var(--color-brand-subtle)] hover:text-[var(--color-brand-accent)] rounded-xl border border-[var(--color-line-subtle)] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4.5 py-2.5 text-xs font-bold text-white bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-hover)] rounded-xl shadow-xs hover:shadow-md transition duration-150 active:scale-[0.98] cursor-pointer"
            >
              Create Profile
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}