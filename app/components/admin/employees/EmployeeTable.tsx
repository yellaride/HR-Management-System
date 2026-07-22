"use client";

import React from "react";
import { Mail, Calendar, ExternalLink, Edit, DollarSign } from "lucide-react";

export interface Employee {
  id: number | string;
  name: string;
  role: string;
  email: string;
  department: string;
  status: string;
  designation?: string;
  joinDate?: string | null;
  salary?: number | null; // Unified base salary mapping
  hourlyRate?: number | null; // Added calculated hourly rate
  joiningDate?: string | null;
  // Optional legacy/backend date fallbacks
  startDate?: string | null;
  createdAt?: string | null;
  // Optional legacy/backend salary fallbacks (may arrive as strings)
  basicSalary?: number | string | null;
  baseSalary?: number | string | null;
  // Optional profile photo fields (backend may provide any of these)
  image?: string;
  picture?: string;
  profilePicture?: string;
  profilePhotoUrl?: string;
  profilePhotoURL?: string;
}

interface EmployeeTableProps {
  employees: Employee[];
  onEdit?: (employee: Employee) => void;
  onViewPortal?: (employee: Employee) => void;
}

export default function EmployeeTable({ employees, onEdit, onViewPortal }: EmployeeTableProps) {
  const getInitials = (name: string) => {
    return (name || "Employee")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "??";
  };

  // Safe formatting for salary values (PKR format)
  const formatSalary = (amount?: number | null) => {
    if (amount === undefined || amount === null) return "N/A";
    try {
      const formatted = new Intl.NumberFormat("en-PK", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
      return `Rs ${formatted}`;
    } catch {
      return `Rs ${amount}`;
    }
  };

  const formatJoinDate = (value?: string | null) => {
    if (!value) return "N/A";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    try {
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(d);
    } catch {
      return value;
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-150 bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">Role & Department</th>
              <th className="px-6 py-4">Salary</th>
              <th className="px-6 py-4">Join Date</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400">
                  No employee records found.
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                const initials = getInitials(emp.name);
                const isStatusActive = String(emp.status).toLowerCase() === "active";
                const displayJoinDate = formatJoinDate(emp.joinDate || emp.joiningDate || null);

                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition duration-150">
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-[11px] tracking-wide overflow-hidden">
                          {/** If backend provides an image/picture, prefer it; otherwise show initials */}
                          {(() => {
                            const imageUrl =
                              emp.image ||
                              emp.picture ||
                              emp.profilePicture ||
                              emp.profilePhotoUrl;

                            if (typeof imageUrl !== "string" || !imageUrl.trim()) return initials;

                            return (
                              <img
                                src={imageUrl}
                                alt={emp.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.onerror = null;
                                  // Hide broken image and rely on initials (handled by conditional rendering next mount).
                                  target.style.display = "none";
                                }}
                              />
                            );
                          })()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 capitalize block leading-tight">
                            {emp.name}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5" title={emp.email}>
                            <Mail className="w-3 h-3 shrink-0" />
                            {emp.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 capitalize leading-tight">
                          {emp.designation || emp.role}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium capitalize mt-0.5">
                          {emp.department}
                        </span>
                      </div>
                    </td>

                    {/* Salary Column */}
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatSalary(emp.salary ?? null)}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-500 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{displayJoinDate}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border ${
                            isStatusActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-amber-50 text-amber-700 border-amber-100"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isStatusActive ? "bg-emerald-500" : "bg-amber-500"}`} />
                          {emp.status}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit?.(emp)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-transparent hover:border-slate-200 transition inline-flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">Edit</span>
                        </button>
                        <button
                          onClick={() => onViewPortal?.(emp)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">Portal</span>
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}