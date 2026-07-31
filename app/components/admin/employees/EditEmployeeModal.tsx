"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { X, ChevronDown } from "lucide-react";
import { Employee } from "./EmployeeTable";

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  errorMessage?: string | null;
  departments?: string[];
  onSave: (id: string | number, data: Omit<Employee, "id">) => Promise<void>;
}

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

export default function EditEmployeeModal({
  isOpen,
  onClose,
  employee,
  departments = [],
  onSave,
}: EditEmployeeModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    designation: "",
    joinDate: "",
    salary: "", // Stores salary
    department: "",
    status: "Active",
  });

  // Admin-configured departments; keep the employee's current value visible
  // even if it is no longer in the list (legacy / renamed departments).
  const departmentOptions = useMemo(() => {
    const configured = departments.filter((dept) => dept.trim().length > 0);
    const current = employee?.department?.trim();
    if (current && !configured.includes(current)) {
      return [current, ...configured];
    }
    return configured;
  }, [departments, employee?.department]);

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

  // Sync form state from props during render when the modal opens or the
  // employee changes (official "adjust state when a prop changes" pattern).
  const [prevEmployee, setPrevEmployee] = useState<Employee | null>(null);
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (employee !== prevEmployee || isOpen !== prevIsOpen) {
    setPrevEmployee(employee);
    setPrevIsOpen(isOpen);

    if (employee && isOpen) {
      // 1. Convert Database ISO/Time strings into exact 'YYYY-MM-DD' for HTML5 date input
      const rawDate = employee.joinDate || employee.joiningDate || employee.startDate || employee.createdAt || "";
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
        : (employee.basicSalary || employee.baseSalary);
      const salaryString = rawSalary !== undefined && rawSalary !== null ? String(rawSalary) : "";

      setFormData({
        name: employee.name || "",
        email: employee.email || "",
        designation: employee.designation || employee.role || "",
        joinDate: formattedDate,
        salary: salaryString,
        department: employee.department || departmentOptions[0] || "",
        status: employee.status || "Active",
      });

      setIsDeptOpen(false);
      setIsStatusOpen(false);
    }
  }

  if (!isOpen || !employee) return null;

  const handleFieldChange = (field: string, value: string) => {
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
      // The form intentionally omits fields like `role`; the API only reads
      // the fields it needs, so the narrower payload is safe at runtime.
      await onSave(employee.id, updatedPayload as unknown as Omit<Employee, "id">);
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
          confirmButton: "px-4.5 py-2.5 text-xs font-bold rounded-xl text-white bg-brand-accent hover:bg-brand-hover border-none outline-none",
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Standard input class generator mapping the purple design scheme
  const getInputClass = () => {
    return "w-full px-3.5 py-2.5 bg-surface-card border border-line-subtle rounded-xl text-xs text-content-main placeholder-content-muted transition-all duration-200 shadow-sm outline-none hover:border-brand-accent/50 focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* Dark backdrop overlay with slight blur */}
      <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-xs transition-opacity z-10" onClick={onClose} />

      {/* Modal Card wrapper */}
      <div className="relative bg-surface-card border border-line-subtle rounded-2xl max-w-md w-full p-6 shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Subtle purple accent line at the top */}
        <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-brand-accent to-brand-hover" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-line-subtle">
          <div>
            <h2 className="text-base font-extrabold text-content-main tracking-tight">Edit Employee Profile</h2>
            <p className="text-[11px] text-content-secondary mt-0.5 font-medium">Modify database values for this team member.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-content-muted hover:text-brand-accent hover:bg-brand-subtle transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-content-muted block">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              className={getInputClass()}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-content-muted block">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              className={getInputClass()}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-content-muted block">Designation</label>
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
              <label className="text-[10px] font-bold uppercase tracking-wider text-content-muted block">Join Date</label>
              <input
                type="date"
                required
                value={formData.joinDate}
                onChange={(e) => handleFieldChange("joinDate", e.target.value)}
                className={`${getInputClass()} cursor-pointer`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-content-muted block">Salary (Rs)</label>
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
              <label className="text-[10px] font-bold uppercase tracking-wider text-content-muted block">Department</label>
              <button
                type="button"
                onClick={() => {
                  setIsDeptOpen(!isDeptOpen);
                  setIsStatusOpen(false);
                }}
                className={`${getInputClass()} flex items-center justify-between text-left cursor-pointer z-40 relative`}
              >
                <span>{formData.department}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-content-muted transition-transform duration-200 ${isDeptOpen ? "rotate-180" : ""}`} />
              </button>

              {isDeptOpen && (
                <div className="dropdown-panel absolute left-0 right-0 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-150 max-h-40 overflow-y-auto">
                  {departmentOptions.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-content-muted">
                      No departments configured. Add departments in Settings first.
                    </div>
                  ) : (
                    departmentOptions.map((dept) => (
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
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Custom Styled Status Dropdown */}
            <div className="space-y-1.5 relative" ref={statusRef}>
              <label className="text-[10px] font-bold uppercase tracking-wider text-content-muted block">Status</label>
              <button
                type="button"
                onClick={() => {
                  setIsStatusOpen(!isStatusOpen);
                  setIsDeptOpen(false);
                }}
                className={`${getInputClass()} flex items-center justify-between text-left cursor-pointer z-40 relative`}
              >
                <span>{formData.status}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-content-muted transition-transform duration-200 ${isStatusOpen ? "rotate-180" : ""}`} />
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
          <div className="flex justify-end items-center gap-2 pt-4 border-t border-line-subtle shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4.5 py-2.5 text-xs font-bold text-content-secondary bg-surface-main hover:bg-brand-subtle hover:text-brand-accent rounded-xl border border-line-subtle transition disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4.5 py-2.5 text-xs font-bold text-white bg-brand-accent hover:bg-brand-hover rounded-xl shadow-xs hover:shadow-md transition duration-150 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}