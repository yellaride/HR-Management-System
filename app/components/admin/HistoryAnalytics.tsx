"use client";

import React, { useEffect, useState, useRef } from "react";
import { TrendingUp, BarChart3, Clock, AlertCircle, FileText, ChevronDown } from "lucide-react";

interface Employee {
  id: string;
  userId: string;
  name: string;
  department: string;
  designation: string;
}

interface HistoryProps {
  employees: Employee[];
  selectedEmployeeId: string;
  onEmployeeChange: (id: string) => void;
  period: "this-month" | "last-month" | "all";
  onPeriodChange: (p: "this-month" | "last-month" | "all") => void;
}

export default function HistoryAnalytics({
  employees,
  selectedEmployeeId,
  onEmployeeChange,
  period,
  onPeriodChange,
}: HistoryProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalDays: 0,
    onTimeDays: 0,
    lateDays: 0,
    absentDays: 0,
    totalHours: 0,
    attendanceRate: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Custom dropdown visibility and reference tracking
  const [isEmpOpen, setIsEmpOpen] = useState(false);
  const empRef = useRef<HTMLDivElement>(null);

  const selectedEmp = employees.find((e) => e.userId === selectedEmployeeId);

  // Close custom dropdown when clicking elsewhere
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (empRef.current && !empRef.current.contains(event.target as Node)) {
        setIsEmpOpen(false);
      }
    }
    if (isEmpOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEmpOpen]);

  useEffect(() => {
    async function loadHistory() {
      if (!selectedEmployeeId) return;
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/attendance?userId=${selectedEmployeeId}&period=${period}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
          setStats(data.stats || {});
        }
      } catch (err) {
        console.error("Failed loading history statistics:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, [selectedEmployeeId, period]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Configuration Controls & Aggregate Cards */}
      <div className="xl:col-span-4 space-y-6">
        <div className="bg-white border border-[var(--color-line-subtle)] rounded-2xl p-5 shadow-3xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <TrendingUp className="w-4 h-4 text-[var(--color-brand-accent)]" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-content-main)]">
              Historical Lookup Parameters
            </span>
          </div>

          {/* Select Target employee (Custom Dropdown) */}
          <div className="space-y-1.5 relative" ref={empRef}>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-content-muted)]">
              Select Employee
            </label>
            
            <button
              type="button"
              onClick={() => setIsEmpOpen(!isEmpOpen)}
              className="w-full px-3.5 py-2.5 bg-[var(--color-surface-card)] border border-[var(--color-line-subtle)] rounded-xl text-xs text-[var(--color-content-main)] transition-all duration-200 shadow-sm outline-none hover:border-[var(--color-brand-accent)]/50 focus:ring-2 focus:ring-[var(--color-brand-accent)]/20 focus:border-[var(--color-brand-accent)] flex items-center justify-between text-left cursor-pointer relative font-semibold"
            >
              <span>
                {selectedEmp 
                  ? `${selectedEmp.name} (${selectedEmp.department})` 
                  : "Select an Employee..."}
              </span>
              <ChevronDown 
                className={`w-3.5 h-3.5 text-[var(--color-content-muted)] transition-transform duration-200 ${
                  isEmpOpen ? "rotate-180" : ""
                }`} 
              />
            </button>

            {isEmpOpen && (
              <div className="dropdown-panel absolute left-0 right-0 mt-1.5 max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150 z-50">
                {employees.map((e) => (
                  <button
                    key={e.userId}
                    type="button"
                    onClick={() => {
                      onEmployeeChange(e.userId);
                      setIsEmpOpen(false);
                    }}
                    className={`dropdown-option w-full text-left text-xs ${
                      selectedEmployeeId === e.userId ? "dropdown-option-active" : ""
                    }`}
                  >
                    {e.name} ({e.department})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Select period ranges */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-content-muted)]">Time Period</label>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onPeriodChange("last-month")}
                className={`w-full py-2.5 text-xs font-bold rounded-xl border transition ${
                  period === "last-month"
                    ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand-accent)] border-[var(--color-brand-accent)]"
                    : "bg-white text-[var(--color-content-secondary)] border-[var(--color-line-subtle)] hover:bg-slate-50"
                }`}
              >
                Last Month (June 2026)
              </button>
              <button
                onClick={() => onPeriodChange("this-month")}
                className={`w-full py-2.5 text-xs font-bold rounded-xl border transition ${
                  period === "this-month"
                    ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand-accent)] border-[var(--color-brand-accent)]"
                    : "bg-white text-[var(--color-content-secondary)] border-[var(--color-line-subtle)] hover:bg-slate-50"
                }`}
              >
                This Month (July 2026)
              </button>
              <button
                onClick={() => onPeriodChange("all")}
                className={`w-full py-2.5 text-xs font-bold rounded-xl border transition ${
                  period === "all"
                    ? "bg-[var(--color-brand-subtle)] text-[var(--color-brand-accent)] border-[var(--color-brand-accent)]"
                    : "bg-white text-[var(--color-content-secondary)] border-[var(--color-line-subtle)] hover:bg-slate-50"
                }`}
              >
                All Partitioned Records
              </button>
            </div>
          </div>

          {/* Profile details block */}
          {selectedEmp && (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
              <span className="text-[10px] text-[var(--color-content-muted)] font-bold uppercase tracking-wider block">Staff Profile</span>
              <div className="font-extrabold text-[var(--color-content-main)]">{selectedEmp.name}</div>
              <div className="text-[10px] text-[var(--color-content-secondary)]">Designation: {selectedEmp.designation}</div>
              <div className="text-[10px] text-[var(--color-content-secondary)]">Department: {selectedEmp.department}</div>
            </div>
          )}
        </div>

        {/* Aggregate Stats Dashboard */}
        <div className="bg-white border border-[var(--color-line-subtle)] rounded-2xl p-5 shadow-3xs space-y-4">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-content-muted)]">
            Aggregated Analytics
          </div>

          {isLoading ? (
            <div className="py-6 text-center text-xs text-[var(--color-content-secondary)]">Recalculating stats...</div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-[var(--color-brand-accent)] flex items-center justify-center font-black text-lg text-[var(--color-brand-accent)] bg-[var(--color-brand-subtle)]">
                  {stats.attendanceRate || 0}%
                </div>
                <div>
                  <div className="text-xs font-black text-[var(--color-content-main)]">Attendance Rate</div>
                  <p className="text-[10px] text-[var(--color-content-secondary)] mt-0.5 leading-relaxed">
                    Based on {stats.totalDays || 0} tracked schedule timesheet dates.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4 text-center">
                <div className="bg-slate-50 p-2 border border-slate-100 rounded-xl">
                  <div className="text-[9px] font-extrabold text-emerald-800 uppercase">On Time</div>
                  <div className="text-base font-black text-emerald-600 mt-0.5">{stats.onTimeDays || 0}</div>
                </div>
                <div className="bg-slate-50 p-2 border border-slate-100 rounded-xl">
                  <div className="text-[9px] font-extrabold text-amber-800 uppercase">Late Arrivals</div>
                  <div className="text-base font-black text-amber-600 mt-0.5">{stats.lateDays || 0}</div>
                </div>
                <div className="bg-slate-50 p-2 border border-slate-100 rounded-xl">
                  <div className="text-[9px] font-extrabold text-rose-800 uppercase">Absent</div>
                  <div className="text-base font-black text-rose-600 mt-0.5">{stats.absentDays || 0}</div>
                </div>
                <div className="bg-slate-50 p-2 border border-slate-100 rounded-xl">
                  <div className="text-[9px] font-extrabold text-indigo-800 uppercase">Total Hours</div>
                  <div className="text-base font-black text-indigo-600 mt-0.5">{stats.totalHours || 0}</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: DETAIL WORKLOG LIST */}
      <div className="xl:col-span-8">
        <div className="bg-white border border-[var(--color-line-subtle)] rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-line-subtle)] bg-slate-50/60 flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-content-muted)]">
              Historical Worklogs Ledger
            </span>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/20 border-b border-[var(--color-line-subtle)] text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-content-muted)]">
                  <th className="px-6 py-4">Punch Date</th>
                  <th className="px-6 py-4">Check-In</th>
                  <th className="px-6 py-4">Check-Out</th>
                  <th className="px-6 py-4">Decimal Hours</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[var(--color-content-secondary)] animate-pulse">
                      Retrieving partitioned logs database...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[var(--color-content-secondary)]">
                      No matching historical logs found for the selected date range.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    let badgeStyle = "bg-slate-50 text-slate-700 border-slate-200";
                    if (log.status === "On Time") badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-100";
                    if (log.status === "Late") badgeStyle = "bg-amber-50 text-amber-700 border-amber-100";
                    if (log.status === "Absent") badgeStyle = "bg-rose-50 text-rose-700 border-rose-100";

                    return (
                      <tr key={log._id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 font-black text-[var(--color-content-main)]">{log.date}</td>
                        <td className="px-6 py-4 font-mono font-semibold">
                          {log.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--"}
                        </td>
                        <td className="px-6 py-4 font-mono font-semibold">
                          {log.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--"}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-500">{log.workingHours || "0"} hrs</td>
                        <td className="px-6 py-4 font-mono font-extrabold text-[var(--color-content-main)]">{log.formattedDuration || "--"}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border ${badgeStyle}`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}