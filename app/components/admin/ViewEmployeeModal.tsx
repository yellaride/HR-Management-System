import React, { useState } from "react";
import Swal from "sweetalert2"; // Import SweetAlert2
import { Employee } from "./EmployeeCard";

interface ViewEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onDelete: (id: string | number) => Promise<void>;
}

// Custom SweetAlert2 Toast configuration for feedback after deletion
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

export default function ViewEmployeeModal({ isOpen, onClose, employee, onDelete }: ViewEmployeeModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !employee) return null;

  // 1. Robust Join Date Parser with common fallbacks
  const rawJoinDate = employee.joinDate || (employee as any).joiningDate || (employee as any).startDate || (employee as any).createdAt;
  let formattedJoinDate = "—";
  if (rawJoinDate) {
    const parsedDate = new Date(rawJoinDate);
    if (!isNaN(parsedDate.getTime())) {
      formattedJoinDate = parsedDate.toLocaleDateString();
    }
  }

  // 2. Safe Salary Parser with conversion for strings (e.g., "50000") and column fallbacks
  const rawSalary = (employee.salary !== undefined && employee.salary !== null)
    ? employee.salary 
    : ((employee as any).basicSalary || (employee as any).baseSalary);

  let formattedSalary = "—";
  if (rawSalary !== undefined && rawSalary !== null && rawSalary !== "") {
    const numericSalary = Number(rawSalary);
    if (!isNaN(numericSalary)) {
      formattedSalary = new Intl.NumberFormat("en-PK", {
        style: "currency",
        currency: "PKR",
        maximumFractionDigits: 0,
      }).format(numericSalary);
    }
  }

  const handleDeleteClick = async () => {
    const result = await Swal.fire({
      title: "Delete Employee Profile?",
      text: `Are you sure you want to permanently delete ${employee.name}? This will remove their registration and credential access.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete profile",
      cancelButtonText: "Cancel",
      reverseButtons: true, 
      buttonsStyling: false, 
      customClass: {
        popup: "bg-white border border-slate-150 rounded-2xl shadow-xl p-6 font-sans text-center",
        title: "text-base font-bold text-slate-900",
        htmlContainer: "text-xs text-slate-500 mt-2 leading-relaxed",
        actions: "flex gap-2 justify-center mt-5 w-full",
        confirmButton: "px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer",
        cancelButton: "px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer",
      },
    });

    if (result.isConfirmed) {
      setIsDeleting(true);
      try {
        await onDelete(employee.id);
        onClose();

        Toast.fire({
          icon: "success",
          title: "Employee record removed",
          customClass: {
            popup: "bg-white border border-slate-100 rounded-2xl shadow-xl p-4 font-sans text-xs",
            title: "text-xs font-bold text-slate-900",
          },
        });
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Could not remove the profile from the database. Please try again.",
          confirmButtonColor: "#4f46e5",
          customClass: {
            popup: "bg-white rounded-2xl border border-slate-100 shadow-xl font-sans",
            title: "text-sm font-bold text-slate-900",
            htmlContainer: "text-xs text-slate-500",
          }
        });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-950">Employee Portal Profile</h2>
            <p className="text-xs text-slate-500 mt-0.5">View directory registration and credentials control.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Details */}
        <div className="space-y-4 py-6">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-50">
            <div className="h-12 w-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-extrabold text-sm uppercase">
              {employee.name ? employee.name.split(" ").map(n => n[0]).join("") : "EE"}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">{employee.name}</h3>
              <p className="text-xs text-indigo-600 font-medium">{employee.role}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Department</span>
              <span className="text-xs font-semibold text-slate-700">{employee.department || "—"}</span>
            </div>
            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Status</span>
              <span className={`inline-flex mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                employee.status === "Active" 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}>
                {employee.status || "Inactive"}
              </span>
            </div>

            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Designation</span>
              <span className="text-xs font-semibold text-slate-700">
                {(employee as any).designation ?? employee.role}
              </span>
            </div>

            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Join Date</span>
              <span className="text-xs font-semibold text-slate-700">
                {formattedJoinDate}
              </span>
            </div>

            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Salary</span>
              <span className="text-xs font-semibold text-slate-700">
                {formattedSalary}
              </span>
            </div>

            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">Role</span>
              <span className="text-xs font-semibold text-slate-700">{employee.role}</span>
            </div>
          </div>

          <div>
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block">System Username / Email</span>
            <span className="text-xs font-semibold text-slate-700 select-all">{employee.email}</span>
          </div>

        </div>

        {/* Danger/Delete Actions Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={isDeleting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl transition disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-16v1a1 1 0 001 1h3m-10 0h3M10 11v6" />
            </svg>
            <span>{isDeleting ? "Deleting..." : "Remove Employee & Credentials"}</span>
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="w-full px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-50 rounded-xl transition"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
}