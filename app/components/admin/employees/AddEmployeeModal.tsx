"use client";

import React, { useEffect, useRef, useState } from "react";
import PasswordInputWithToggle from "../../PasswordInputWithToggle";
import { AlertTriangle, ChevronDown, X } from "lucide-react";

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
    salary: number; 
    joinDate: string;
  }) => void;
  departments?: string[]; // Changed to optional for extra safety
}

const STATUSES = ["Active", "On Leave"];

export default function AddEmployeeModal({
  isOpen,
  onClose,
  onSave,
  errorMessage,
  departments = [], // Default to an empty array to prevent crashes
}: AddEmployeeModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: "", // Start empty, will be initialized dynamically
    designation: "",
    salary: "" as string | number, 
    joinDate: "",
    status: "Active",
  });

  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const deptRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Removed render-phase setState to prevent infinite re-render loops.
  // State synchronization is handled via effects below.


  // Click outside listener (valid use of useEffect since it syncs with browser/DOM events)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (deptRef.current && !deptRef.current.contains(target)) {
        setIsDeptOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(target)) {
        setIsStatusOpen(false);
      }
    }

    if (isDeptOpen || isStatusOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDeptOpen, isStatusOpen]);

  if (!isOpen) return null;

  // Resolved type warning by replacing "any" with specific and safe definitions
  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
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

  const validateForm = (): boolean => {
    const tempErrors: Record<string, string> = {};

    if (!formData.name.trim()) tempErrors.name = "Full name is required";

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

    if (!formData.joinDate) tempErrors.joinDate = "Join date is required";

    const salaryNum = Number(formData.salary);
    if (formData.salary === "" || isNaN(salaryNum) || salaryNum < 0) {
      tempErrors.salary = "Please specify a valid positive salary";
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
      salary: Number(formData.salary) || 0,
      joinDate: formData.joinDate,
    });
  };

  const getInputClass = (fieldName: string) => {
    const baseClass =
      "w-full px-3.5 py-2.5 bg-[var(--color-surface-card)] border rounded-xl text-xs text-[var(--color-content-main)] placeholder-[var(--color-content-muted)] transition-all duration-200 shadow-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed";
    const normalClass =
      "border-[var(--color-line-subtle)] hover:border-[var(--color-brand-accent)]/50 focus:ring-2 focus:ring-[var(--color-brand-accent)]/20 focus:border-[var(--color-brand-accent)]";
    const errorClass =
      "border-rose-300 bg-rose-50/10 text-rose-900 hover:border-rose-400 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500";

    return `${baseClass} ${errors[fieldName] ? errorClass : normalClass}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="absolute inset-0 bg-slate-900/35 backdrop-blur-xs transition-opacity z-10"
        onClick={onClose}
      />

      <div
        className="relative bg-[var(--color-surface-card)] border border-[var(--color-line-subtle)] rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[var(--color-brand-accent)] to-[var(--color-brand-hover)]" />

        <div className="flex items-start justify-between pb-4 border-b border-[var(--color-line-subtle)] shrink-0">
          <div>
            <h2 className="text-base font-extrabold text-[var(--color-content-main)] tracking-tight">
              Add New Employee
            </h2>
            <p className="text-[11px] text-[var(--color-content-secondary)] mt-0.5 font-medium">
              Fill in the fields below to register a new profile in the organization.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-content-muted)] hover:text-[var(--color-brand-accent)] hover:bg-[var(--color-brand-subtle)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto pr-1 -mr-1 mt-4 space-y-4"
        >
          {(generalError || errorMessage) && (
            <div className="flex items-start gap-3 p-3.5 bg-rose-50/75 border border-rose-100 rounded-xl text-rose-800 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold">
                  {errorMessage && !generalError ? "Submission Error" : "Validation Notice"}
                </h4>
                <p className="text-[11px] text-rose-600/90 mt-0.5 font-medium">
                  {generalError || errorMessage}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
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

            <div className="space-y-1.5 relative" ref={deptRef}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-content-muted)] block">
                Department
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsDeptOpen(!isDeptOpen);
                  setIsStatusOpen(false);
                }}
                className={`${getInputClass("department")} flex items-center justify-between text-left cursor-pointer z-40 relative`}
              >
                <span>{formData.department || "Select Department"}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[var(--color-content-muted)] transition-transform duration-200 ${
                    isDeptOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDeptOpen && (
                <div className="dropdown-panel absolute left-0 right-0 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-150 max-h-44 overflow-y-auto">
                  {departments.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-[var(--color-content-muted)]">
                      No departments configured.
                    </div>
                  ) : (
                    departments.map((dept) => (
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
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-content-muted)] block">
                Salary (Rs)
              </label>
              <input
                type="number"
                min={0}
                step="1"
                placeholder="e.g. 80000"
                value={formData.salary}
                onChange={(e) => handleInputChange("salary", e.target.value)}
                className={getInputClass("salary")}
              />
              {errors.salary && (
                <p className="text-[10px] text-rose-500 font-semibold">{errors.salary}</p>
              )}
            </div>

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

            <div className="space-y-1.5 relative" ref={statusRef}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-content-muted)] block">
                Initial Status
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsStatusOpen(!isStatusOpen);
                  setIsDeptOpen(false);
                }}
                className={`${getInputClass("status")} flex items-center justify-between text-left cursor-pointer z-40 relative`}
              >
                <span>{formData.status}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[var(--color-content-muted)] transition-transform duration-200 ${
                    isStatusOpen ? "rotate-180" : ""
                  }`}
                />
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

          <div className="flex justify-end items-center gap-2 pt-4 border-t border-[var(--color-line-subtle)] shrink-0">
            <button
              type="button"
              onClick={onClose}
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