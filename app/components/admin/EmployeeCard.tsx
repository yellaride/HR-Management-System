import React from "react";

export interface Employee {
  id: number | string;
  name: string;
  role: string;
  email: string;
  department: string;
  status: string;
  // Additional employment fields (admin view)
  designation?: string;
  joinDate?: string | null;
  salary?: number | null;
  joiningDate?: string | null;
  salaryDate?: number | null;
}


interface EmployeeCardProps {
  employee: Employee;
  onEdit?: (employee: Employee) => void;
  onViewPortal?: (employee: Employee) => void;
}

export default function EmployeeCard({ employee, onEdit, onViewPortal }: EmployeeCardProps) {
  // Generate initials for the avatar placeholder
  const initials = employee.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-5 group">
      
      {/* Top Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Profile Initials Avatar */}
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-xs tracking-wider group-hover:bg-indigo-100/70 transition duration-150">
            {initials}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 leading-tight group-hover:text-indigo-600 transition duration-150">
              {employee.name}
            </h3>
            <span className="text-[11px] font-medium text-slate-500 leading-tight block mt-0.5">
              {employee.role}
            </span>
          </div>
        </div>

        {/* Dynamic Status Badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
            employee.status === "Active"
              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
              : "bg-amber-50 text-amber-600 border border-amber-100"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              employee.status === "Active" ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
          {employee.status}
        </span>
      </div>

      {/* Middle Parameters */}
      <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400 font-medium">Department</span>
          <span className="text-slate-700 font-semibold">{employee.department}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 font-medium">Email</span>
          <span className="text-slate-700 font-semibold truncate max-w-[170px]" title={employee.email}>
            {employee.email}
          </span>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
        <button
          onClick={() => onEdit?.(employee)}
          className="px-3 py-1.5 text-[11px] font-semibold tracking-wide text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
        >
          Edit
        </button>
        <button
          onClick={() => onViewPortal?.(employee)}
          className="px-3 py-1.5 text-[11px] font-semibold tracking-wide text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 rounded-lg transition"
        >
          View Portal
        </button>
      </div>
    </div>
  );
}