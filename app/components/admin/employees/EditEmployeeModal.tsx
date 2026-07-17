"use client";

import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { X, ChevronDown } from "lucide-react";
import { Employee } from "./EmployeeTable";

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  errorMessage?: string | null;
  onSave: (id: string | number, data: any) => Promise<void>;
}

const DEPARTMENTS = ["Engineering", "Design", "Operations", "Marketing"];
const STATUSES = ["Active", "On Leave"];

// Custom SweetAlert2 Toast configuration matching the purple design token schema
const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

export default function EditEmployeeModal({ isOpen, onClose, employee, onSave }: EditEmployeeModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    designation: "",
    joinDate: "",
    salary: "", // Stores salary
    department: "Engineering",
    status: "Active",
  });

  // State to handle custom dropdown visibility
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refs for outside click tracking
  const deptRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Global mouse event listener to close dropdowns safely when clicking outside
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

  useEffect(() => {
    if (!employee || !isOpen) return;

    // 1. Convert Database ISO/Time strings into exact 'YYYY-MM-DD' for HTML5 date input
    const rawDate = employee.joinDate || (employee as any).joiningDate || (employee as any).startDate || (employee as any).createdAt || "";
    let formattedDate = "";
    if (rawDate) {
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate.getTime())) {
        formattedDate = parsedDate.toISOString().split("T")[0];
      }
    }

    // 2. Safely parse salary / hourly rate (converting numbers to strings)
    const rawSalary = employee.salary !== undefined && employee.salary !== null
      ? employee.salary
      : ((employee as any).basicSalary || (employee as any).baseSalary);
    const salaryString = rawSalary !== undefined && rawSalary !== null ? String(rawSalary) : "";

    setFormData({
      name: employee.name || "",
      email: employee.email || "",
      designation: (employee as any).designation || employee.role || "",
      joinDate: formattedDate,
      salary: salaryString,
      department: employee.department || "Engineering",
      status: employee.status || "Active",
    });

    setIsDeptOpen(false);
    setIsStatusOpen(false);
  }, [employee, isOpen]);

  if (!isOpen || !employee) return null;

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.designation) return;

    const updatedPayload = {
      ...formData,
      salary: formData.salary === "" ? null : Number(formData.salary),
    };

    setIsSubmitting(true);
    try {
      await onSave(employee.id, updatedPayload);
      onClose();
      
      Toast.fire({
        icon: "success",
        title: "Profile updated successfully",
        customClass: {
          popup: "bg-white border border-[#e2e0e8] rounded-2xl shadow-xl p-4 font-sans text-xs",
          title: "text-xs font-bold text-[#181124]",
        },
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "Could not save the employee details. Please try again.",
        confirmButtonColor: "#7c3aed",
        customClass: {
          popup: "bg-white rounded-2xl border border-[#e2e0e8] shadow-xl font-sans",
          title: "text-sm font-bold text-[#181124]",
          htmlContainer: "text-xs text-[#534a60]",
          confirmButton: "px-4.5 py-2.5 text-xs font-bold rounded-xl text-white bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-hover)] border-none outline-none",
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Standard input class generator mapping the purple design scheme
  const getInputClass = () => {
    return "w-full px-3.5 py-2.5 bg-[var(--color-surface-card)] border border-[var(--color-line-subtle)] rounded-xl text-xs text-[var(--color-content-main)] placeholder-[var(--color-content-muted)] transition-all duration-200 shadow-sm outline-none hover:border-[var(--color-brand-accent)]/50 focus:ring-2 focus:ring-[var(--color-brand-accent)]/20 focus:border-[var(--color-brand-accent)]";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* Dark backdrop overlay with slight blur */}
      <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-xs transition-opacity z-10" onClick={onClose} />

      {/* Modal Card wrapper */}
      <div className="relative bg-[var(--color-surface-card)] border border-[var(--color-line-subtle)] rounded-2xl max-w-md w-full p-6 shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Subtle purple accent line at the top */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[var(--color-brand-accent)] to-[var(--color-brand-hover)]" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--color-line-subtle)]">
          <div>
            <h2 className="text-base font-extrabold text-[var(--color-content-main)] tracking-tight">Edit Employee Profile</h2>
            <p className="text-[11px] text-[var(--color-content-secondary)] mt-0.5 font-medium">Modify database values for this team member.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--color-content-muted)] hover:text-[var(--color-brand-accent)] hover:bg-[var(--color-brand-subtle)] transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-content-muted)] block">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              className={getInputClass()}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-content-muted)] block">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              className={getInputClass()}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-content-muted)] block">Designation</label>
            <input
              type="text"
              required
              value={formData.designation}
              onChange={(e) => handleFieldChange("designation", e.target.value)}
              className={getInputClass()}
            />
          </div>

          {/* Grid Layout containing Join Date, Salary, Department, and Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-content-muted)] block">Join Date</label>
              <input
                type="date"
                required
                value={formData.joinDate}
                onChange={(e) => handleFieldChange("joinDate", e.target.value)}
                className={`${getInputClass()} cursor-pointer`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-content-muted)] block">Salary (Rs)</label>
              <input
                type="number"
                required
                min="0"
                step="1"
                placeholder="e.g. 80000"
                value={formData.salary}
                onChange={(e) => handleFieldChange("salary", e.target.value)}
                className={getInputClass()}
              />
            </div>

            {/* Custom Styled Department Dropdown */}
            <div className="space-y-1.5 relative" ref={deptRef}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-content-muted)] block">Department</label>
              <button
                type="button"
                onClick={() => {
                  setIsDeptOpen(!isDeptOpen);
                  setIsStatusOpen(false);
                }}
                className={`${getInputClass()} flex items-center justify-between text-left cursor-pointer z-40 relative`}
              >
                <span>{formData.department}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[var(--color-content-muted)] transition-transform duration-200 ${isDeptOpen ? "rotate-180" : ""}`} />
              </button>

              {isDeptOpen && (
                <div className="dropdown-panel absolute left-0 right-0 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-150 max-h-40 overflow-y-auto">
                  {DEPARTMENTS.map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => {
                        handleFieldChange("department", dept);
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

            {/* Custom Styled Status Dropdown */}
            <div className="space-y-1.5 relative" ref={statusRef}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-content-muted)] block">Status</label>
              <button
                type="button"
                onClick={() => {
                  setIsStatusOpen(!isStatusOpen);
                  setIsDeptOpen(false);
                }}
                className={`${getInputClass()} flex items-center justify-between text-left cursor-pointer z-40 relative`}
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
                        handleFieldChange("status", status);
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

          {/* Footer Actions */}
          <div className="flex justify-end items-center gap-2 pt-4 border-t border-[var(--color-line-subtle)] shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4.5 py-2.5 text-xs font-bold text-[var(--color-content-secondary)] bg-[var(--color-surface-main)] hover:bg-[var(--color-brand-subtle)] hover:text-[var(--color-brand-accent)] rounded-xl border border-[var(--color-line-subtle)] transition disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4.5 py-2.5 text-xs font-bold text-white bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-hover)] rounded-xl shadow-xs hover:shadow-md transition duration-150 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}