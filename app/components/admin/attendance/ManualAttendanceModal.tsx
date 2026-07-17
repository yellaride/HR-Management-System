"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Calendar, ChevronDown } from "lucide-react";

interface Employee {
  userId: string;
  name: string;
}

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  defaultDate: string;
  onSave: (payload: { userId: string; date: string; checkIn: string | null; checkOut: string | null; status: "On Time" | "Late" | "Absent" }) => Promise<void>;
}

export default function ManualAttendanceModal({
  isOpen,
  onClose,
  employees,
  defaultDate,
  onSave,
}: ManualAttendanceModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form parameters
  const [targetUserId, setTargetUserId] = useState(employees[0]?.userId || "");
  const [targetDate, setTargetDate] = useState(defaultDate);
  const [checkInTime, setCheckInTime] = useState("09:00");
  const [checkOutTime, setCheckOutTime] = useState("17:00");
  const [status, setStatus] = useState<"On Time" | "Late" | "Absent">("On Time");

  // Custom select visibility controls
  const [isEmpOpen, setIsEmpOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const empRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  const todayStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }).slice(0, 10);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (empRef.current && !empRef.current.contains(target)) {
        setIsEmpOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(target)) {
        setIsStatusOpen(false);
      }
    }
    if (isEmpOpen || isStatusOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEmpOpen, isStatusOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetDate > todayStr) {
      setFormError("Date selection error: Future dates cannot be registered.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const isAbsent = status === "Absent";

      await onSave({
        userId: targetUserId,
        date: targetDate,
        checkIn: isAbsent ? null : `${targetDate}T${checkInTime}:00+05:00`,
        checkOut: isAbsent ? null : `${targetDate}T${checkOutTime}:00+05:00`,
        status,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed saving manual record.";
      setFormError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedEmployee = employees.find((e) => e.userId === targetUserId);

  const elementStyle = "w-full px-3.5 py-2.5 bg-[var(--color-surface-card)] border border-[var(--color-line-subtle)] rounded-xl text-xs text-[var(--color-content-main)] placeholder-[var(--color-content-muted)] transition-all duration-200 shadow-sm outline-none hover:border-[var(--color-brand-accent)]/50 focus:ring-2 focus:ring-[var(--color-brand-accent)]/20 focus:border-[var(--color-brand-accent)] flex items-center justify-between text-left cursor-pointer relative font-semibold h-[38px] [color-scheme:light]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
      <div className="bg-white border border-[var(--color-line-subtle)] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden text-[var(--color-content-main)]">
        <div className="px-6 py-4 border-b border-[var(--color-line-subtle)] flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[var(--color-content-main)]">
            <Calendar className="w-4 h-4 text-[var(--color-brand-accent)]" />
            <span>Log Manual Work Punches</span>
          </div>
          <button type="button" onClick={onClose} className="cursor-pointer">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-semibold">
              {formError}
            </div>
          )}

          {/* 1. Custom Employee Dropdown */}
          <div className="relative" ref={empRef}>
            <label className="block text-[10px] font-bold uppercase mb-1.5 text-[var(--color-content-muted)]">Employee Account</label>
            <button
              type="button"
              onClick={() => {
                setIsEmpOpen(!isEmpOpen);
                setIsStatusOpen(false);
              }}
              className={elementStyle}
            >
              <span>{selectedEmployee ? selectedEmployee.name : "Select Employee"}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[var(--color-content-muted)] transition-transform duration-200 ${isEmpOpen ? "rotate-180" : ""}`} />
            </button>

            {isEmpOpen && (
              <div className="dropdown-panel absolute left-0 right-0 mt-1.5 max-h-40 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150 z-50 bg-white border rounded-xl shadow-lg">
                {employees.map((emp) => (
                  <button
                    key={emp.userId}
                    type="button"
                    onClick={() => {
                      setTargetUserId(emp.userId);
                      setIsEmpOpen(false);
                    }}
                    className={`dropdown-option w-full text-left text-xs px-3.5 py-2 transition hover:bg-slate-50 ${
                      targetUserId === emp.userId ? "dropdown-option-active" : ""
                    }`}
                  >
                    {emp.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 2. Styled Date Input */}
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1.5 text-[var(--color-content-muted)]">Target Date</label>
              <input
                type="date"
                required
                value={targetDate}
                max={todayStr}
                onChange={(e) => setTargetDate(e.target.value)}
                className={elementStyle}
              />
            </div>

            {/* 3. Custom Status Dropdown */}
            <div className="relative" ref={statusRef}>
              <label className="block text-[10px] font-bold uppercase mb-1.5 text-[var(--color-content-muted)]">Attendance Status</label>
              <button
                type="button"
                onClick={() => {
                  setIsStatusOpen(!isStatusOpen);
                  setIsEmpOpen(false);
                }}
                className={elementStyle}
              >
                <span>{status}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[var(--color-content-muted)] transition-transform duration-200 ${isStatusOpen ? "rotate-180" : ""}`} />
              </button>

              {isStatusOpen && (
                <div className="dropdown-panel absolute left-0 right-0 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-150 z-50 bg-white border rounded-xl shadow-lg">
                  {(["On Time", "Late", "Absent"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setStatus(opt);
                        setIsStatusOpen(false);
                      }}
                      className={`dropdown-option w-full text-left text-xs px-3.5 py-2 transition hover:bg-slate-50 ${
                        status === opt ? "dropdown-option-active" : ""
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 4. Styled Time Inputs */}
          {status !== "Absent" && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5 text-[var(--color-content-muted)]">Check-In</label>
                <input
                  type="time"
                  required
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className={elementStyle}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase mb-1.5 text-[var(--color-content-muted)]">Check-Out</label>
                <input
                  type="time"
                  required
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className={elementStyle}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[var(--color-content-secondary)] bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              className="px-4 py-2 text-xs font-bold text-white bg-[var(--color-brand-accent)] rounded-xl disabled:opacity-50 cursor-pointer animate-in fade-in duration-100"
            >
              {submitting ? "Saving..." : "Save Work Log"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}