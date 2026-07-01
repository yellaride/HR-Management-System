"use client";

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2"; // Import SweetAlert2
import { Employee } from "./EmployeeCard";

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSave: (id: string | number, data: any) => Promise<void>;
}

// Custom SweetAlert2 Toast configuration matching your design system
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
    salary: "",
    department: "Engineering",
    status: "Active",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!employee || !isOpen) return;

    // 1. Convert Database ISO/Time strings into exact 'YYYY-MM-DD' for HTML5 date input
    const rawDate = employee.joinDate || (employee as any).joiningDate || (employee as any).startDate || (employee as any).createdAt || "";
    let formattedDate = "";
    if (rawDate) {
      const parsedDate = new Date(rawDate);
      if (!isNaN(parsedDate.getTime())) {
        formattedDate = parsedDate.toISOString().split("T")[0]; // Extracts only the date portion
      }
    }

    // 2. Safely parse salary (converting numbers to strings, handling database variation aliases)
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
  }, [employee, isOpen]);

  if (!isOpen || !employee) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.designation) return;

    // 3. Package the payload and parse salary back to a numeric type for database safety
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
          popup: "bg-white border border-slate-100 rounded-2xl shadow-xl p-4 font-sans text-xs",
          title: "text-xs font-bold text-slate-900",
        },
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "Could not save the employee details. Please try again.",
        confirmButtonColor: "#4f46e5",
        customClass: {
          popup: "bg-white rounded-2xl border border-slate-100 shadow-xl font-sans",
          title: "text-sm font-bold text-slate-900",
          htmlContainer: "text-xs text-slate-500",
          confirmButton: "px-4 py-2 text-xs font-bold rounded-xl",
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-950">Edit Employee Profile</h2>
            <p className="text-xs text-slate-500 mt-0.5">Modify database values for this team member.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">Designation</label>
            <input
              type="text"
              required
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              className="form-input"
            />
          </div>

          {/* Grid Layout containing Join Date, Salary, Department, and Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">Join Date</label>
              <input
                type="date"
                required
                value={formData.joinDate}
                onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">Salary (PKR)</label>
              <input
                type="number"
                required
                min="0"
                placeholder="e.g. 75000"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="form-input cursor-pointer"
              >
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Operations">Operations</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-input cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end items-center gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}