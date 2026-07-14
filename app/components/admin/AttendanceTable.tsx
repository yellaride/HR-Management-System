"use client";

import React, { useState, useEffect, useRef } from "react";
import { Building, Edit2, Eye, ChevronDown, Clock } from "lucide-react";

interface RecordRow {
  userId: string;
  name: string;
  department: string;
  designation: string;
  shiftTime: string; // Added Shift Time
  checkIn: string;
  checkOut: string;
  rawCheckIn: string | null;
  rawCheckOut: string | null;
  workingHours: number;
  formattedDuration: string;
  status: "On Time" | "Late" | "Absent";
}

interface TableProps {
  records: RecordRow[];
  onMarkStatus: (userId: string, status: "On Time" | "Late" | "Absent") => void;
  onEditTimesheet: (userId: string) => void;
  onDrillHistory: (userId: string) => void;
}

// Custom interactive dropdown to mimic the design of AttendanceFilters
interface StatusDropdownProps {
  userId: string;
  currentStatus: "On Time" | "Late" | "Absent";
  onStatusChange: (userId: string, status: "On Time" | "Late" | "Absent") => void;
}

function StatusDropdown({ userId, currentStatus, onStatusChange }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const options: ("On Time" | "Late" | "Absent")[] = ["On Time", "Late", "Absent"];

  const triggerClass = "px-3 py-1.5 bg-[var(--color-surface-card)] border border-[var(--color-line-subtle)] rounded-xl text-xs font-bold text-[var(--color-content-secondary)] transition-all duration-200 shadow-3xs outline-none hover:border-[var(--color-brand-accent)]/50 focus:ring-2 focus:ring-[var(--color-brand-accent)]/20 focus:border-[var(--color-brand-accent)] flex items-center justify-between gap-1.5 cursor-pointer relative select-none";

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={triggerClass}
      >
        <span>{currentStatus}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[var(--color-content-muted)] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="dropdown-panel absolute right-0 mt-1.5 w-28 max-h-40 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150 z-50">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onStatusChange(userId, opt);
                setIsOpen(false);
              }}
              className={`dropdown-option ${
                currentStatus === opt ? "dropdown-option-active" : ""
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AttendanceTable({
  records,
  onMarkStatus,
  onEditTimesheet,
  onDrillHistory,
}: TableProps) {
  return (
    <div className="bg-white border border-[var(--color-line-subtle)] rounded-2xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-[var(--color-line-subtle)] text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-content-muted)]">
              <th className="px-6 py-4">Employee Information</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Shift Time</th>
              <th className="px-6 py-4">Duty Status</th>
              <th className="px-6 py-4">Checking Punches</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4 text-right">Quick Management Options</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {records.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-[var(--color-content-secondary)]">
                  No active employee timesheet logs match selected criteria.
                </td>
              </tr>
            ) : (
              records.map((rec) => {
                let badgeStyle = "bg-slate-50 text-slate-700 border-slate-200";
                if (rec.status === "On Time") badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-100";
                if (rec.status === "Late") badgeStyle = "bg-amber-50 text-amber-700 border-amber-100";
                if (rec.status === "Absent") badgeStyle = "bg-rose-50 text-rose-700 border-rose-100";

                const isOnDuty = rec.rawCheckIn && !rec.rawCheckOut;

                return (
                  <tr key={rec.userId} className="hover:bg-slate-50/50 transition">
                    {/* Name Card info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[var(--color-brand-subtle)] text-[var(--color-brand-accent)] flex items-center justify-center font-black text-xs">
                          {rec.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--color-content-main)]">{rec.name}</div>
                          <div className="text-[10px] font-mono text-[var(--color-content-muted)]">{rec.designation}</div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-6 py-4 text-[var(--color-content-secondary)] font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{rec.department}</span>
                      </div>
                    </td>

                    {/* Shift Time Column */}
                    <td className="px-6 py-4 font-mono font-bold text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{rec.shiftTime}</span>
                      </div>
                    </td>

                    {/* Status Pill Indicator */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border ${badgeStyle}`}>
                        {rec.status}
                      </span>
                    </td>

                    {/* Punches times */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-slate-50 px-2 border border-slate-100 rounded-lg text-[10px] py-1">
                          In: <span className="font-extrabold text-[var(--color-content-main)]">{rec.checkIn || "--:--"}</span>
                        </div>
                        <div className="bg-slate-50 px-2 border border-slate-100 rounded-lg text-[10px] py-1">
                          Out: {isOnDuty ? (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 animate-pulse">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                              On Duty
                            </span>
                          ) : (
                            <span className="font-extrabold text-[var(--color-content-main)]">{rec.checkOut || "--:--"}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Working Hours duration */}
                    <td className="px-6 py-4 text-[var(--color-content-secondary)] font-mono font-bold">
                      {isOnDuty ? "Active Shift" : (rec.formattedDuration || "--")}
                    </td>

                    {/* Quick Controls */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <StatusDropdown
                          userId={rec.userId}
                          currentStatus={rec.status}
                          onStatusChange={onMarkStatus}
                        />

                        {/* Adjust check log */}
                        <button
                          onClick={() => onEditTimesheet(rec.userId)}
                          className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-600 rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Analytics Drill details */}
                        <button
                          onClick={() => onDrillHistory(rec.userId)}
                          className="p-1.5 bg-[var(--color-brand-subtle)] text-[var(--color-brand-accent)] hover:bg-[var(--color-brand-accent)] hover:text-white rounded-lg transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
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