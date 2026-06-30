"use client";

import React, { useState } from "react";
import { 
  CalendarPlus, 
  HeartPulse, 
  Coffee, 
  Palmtree, 
  Calendar, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  X,
  AlertCircle
} from "lucide-react";

interface LeaveRecord {
  id: number;
  type: "Annual Leave" | "Sick Leave" | "Casual Leave";
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
}

// Initial Mock Leave Logs
const initialHistory: LeaveRecord[] = [
  {
    id: 1,
    type: "Annual Leave",
    startDate: "2026-07-10",
    endDate: "2026-07-15",
    days: 5,
    reason: "Summer family trip.",
    status: "Approved",
  },
  {
    id: 2,
    type: "Sick Leave",
    startDate: "2026-06-02",
    endDate: "2026-06-04",
    days: 2,
    reason: "Wisdom teeth extraction recovery.",
    status: "Approved",
  },
  {
    id: 3,
    type: "Casual Leave",
    startDate: "2026-05-18",
    endDate: "2026-05-19",
    days: 1,
    reason: "Urgent vehicle registration renewals.",
    status: "Rejected",
  },
];

export default function EmployeeLeavePage() {
  // Leave Token Balances
  const [tokens, setTokens] = useState({
    annual: { used: 3, total: 15 },
    sick: { used: 4, total: 8 },
    casual: { used: 3, total: 6 },
  });

  const [history, setHistory] = useState<LeaveRecord[]>(initialHistory);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState(false);

  // Form State
  const [form, setForm] = useState({
    type: "Annual Leave" as "Annual Leave" | "Sick Leave" | "Casual Leave",
    startDate: "",
    endDate: "",
    reason: "",
  });

  // Dynamic leave submission handler
  const handleLeaveApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || !form.reason) return;

    // Calculate mock days (using static 3 days for mock calculation)
    const diffTime = Math.abs(new Date(form.endDate).getTime() - new Date(form.startDate).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Create leave item
    const newRequest: LeaveRecord = {
      id: Date.now(),
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      days: diffDays,
      reason: form.reason,
      status: "Pending",
    };

    // Deduct from corresponding token
    setTokens((prev) => {
      const copy = { ...prev };
      if (form.type === "Annual Leave") copy.annual.used += diffDays;
      if (form.type === "Sick Leave") copy.sick.used += diffDays;
      if (form.type === "Casual Leave") copy.casual.used += diffDays;
      return copy;
    });

    setHistory([newRequest, ...history]);
    setIsModalOpen(false);
    setNoticeMessage(true);

    // Reset Form
    setForm({
      type: "Annual Leave",
      startDate: "",
      endDate: "",
      reason: "",
    });

    setTimeout(() => {
      setNoticeMessage(false);
    }, 4000);
  };

  // Badge styles helper matching purple token themes
  const getStatusStyles = (status: LeaveRecord["status"]) => {
    switch (status) {
      case "Approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Rejected":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-amber-50 text-amber-700 border-amber-100";
    }
  };

  const getLeaveTypeStyles = (type: LeaveRecord["type"]) => {
    switch (type) {
      case "Annual Leave":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "Sick Leave":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-purple-50 text-purple-700 border-purple-100";
    }
  };

  return (
    <div className=" pt-4 pb-12 bg-surface-main min-h-screen">
      
      {/* 1. Page Header */}
      <div className="pb-6 border-b border-line-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-content-main tracking-tight">Leaves Dashboard</h1>
          <p className="mt-1 text-xs text-content-secondary">
            View allocated leave tokens, check approval flags, and submit request files.
          </p>
        </div>

        {/* Apply Button triggering our custom styled modal */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-brand-filled inline-flex items-center gap-2 sm:w-auto"
        >
          <CalendarPlus className="w-4 h-4" />
          <span>Apply for Leaves</span>
        </button>
      </div>

      {/* Action Notification Banner */}
      {noticeMessage && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Your leave submission has been transmitted and logged in your directory.</span>
        </div>
      )}

      {/* 2. Leave Tokens Allocation Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Annual Leaves Remaining */}
        <div className="p-5 rounded-2xl border border-line-subtle bg-surface-card shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-content-muted">
              Annual Balance
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Palmtree className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-content-main block">
              {tokens.annual.total - tokens.annual.used} <span className="text-sm font-semibold text-content-secondary">/ {tokens.annual.total} Days Left</span>
            </span>
            <span className="text-[10px] text-content-muted font-medium block mt-1">
              Used {tokens.annual.used} days of standard annual allotment.
            </span>
          </div>
        </div>

        {/* Sick Leaves Remaining */}
        <div className="p-5 rounded-2xl border border-line-subtle bg-surface-card shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-content-muted">
              Sick Balance
            </span>
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-content-main block">
              {tokens.sick.total - tokens.sick.used} <span className="text-sm font-semibold text-content-secondary">/ {tokens.sick.total} Days Left</span>
            </span>
            <span className="text-[10px] text-content-muted font-medium block mt-1">
              Used {tokens.sick.used} days of allocated sick leave.
            </span>
          </div>
        </div>

        {/* Casual Leaves Remaining */}
        <div className="p-5 rounded-2xl border border-line-subtle bg-surface-card shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-content-muted">
              Casual Balance
            </span>
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
              <Coffee className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-content-main block">
              {tokens.casual.total - tokens.casual.used} <span className="text-sm font-semibold text-content-secondary">/ {tokens.casual.total} Days Left</span>
            </span>
            <span className="text-[10px] text-content-muted font-medium block mt-1">
              Used {tokens.casual.used} days of casual exception leaves.
            </span>
          </div>
        </div>

      </div>

      {/* 3. History Logs List */}
      <div className="space-y-3">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-content-muted">
          Your Request History
        </div>

        <div className="bg-surface-card border border-line-subtle rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-main border-b border-line-subtle text-content-muted text-[10px] font-extrabold uppercase tracking-widest">
                  <th className="px-6 py-4">Leave Type</th>
                  <th className="px-6 py-4">Requested Dates</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4 max-w-sm">Reason for Leave</th>
                  <th className="px-6 py-4 text-center">Status Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle text-content-secondary text-xs">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-surface-main/30 transition">
                    
                    {/* Leave Type Badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wide ${getLeaveTypeStyles(record.type)}`}>
                        {record.type}
                      </span>
                    </td>

                    {/* Date Bounds */}
                    <td className="px-6 py-4 font-semibold text-content-main">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-content-muted" />
                        <span>{record.startDate} to {record.endDate}</span>
                      </div>
                    </td>

                    {/* Total Duration Days */}
                    <td className="px-6 py-4 font-bold text-content-main">
                      {record.days} {record.days === 1 ? "Day" : "Days"}
                    </td>

                    {/* Truncated Reason column */}
                    <td className="px-6 py-4 max-w-sm">
                      <div className="flex items-start gap-1.5 leading-normal">
                        <FileText className="w-3.5 h-3.5 text-content-muted mt-0.5 flex-shrink-0" />
                        <span className="truncate block text-content-secondary" title={record.reason}>
                          {record.reason}
                        </span>
                      </div>
                    </td>

                    {/* Duty Status Badge */}
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${getStatusStyles(record.status)}`}>
                          {record.status === "Approved" && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                          {record.status === "Rejected" && <XCircle className="w-3 h-3 text-rose-500" />}
                          {record.status === "Pending" && <Clock className="w-3 h-3 text-amber-500" />}
                          {record.status}
                        </span>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Apply for Leaves Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-content-main/50 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative bg-surface-card border border-line-subtle rounded-2xl max-w-md w-full p-6 shadow-xl z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-line-subtle">
              <div>
                <h2 className="text-base font-bold text-content-main">Request Leave</h2>
                <p className="text-xs text-content-secondary mt-0.5">Prepare details to queue leave request.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-content-muted hover:text-content-main hover:bg-surface-main transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLeaveApply} className="space-y-4 pt-4">
              {/* Type selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-content-secondary block">
                  Select Leave Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as LeaveRecord["type"] })}
                  className="w-full px-3 py-2 bg-surface-main border border-line-subtle rounded-xl text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-brand-accent transition cursor-pointer"
                >
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Casual Leave">Casual Leave</option>
                </select>
              </div>

              {/* Start & End Date Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-content-secondary block">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-main border border-line-subtle rounded-xl text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-brand-accent transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-content-secondary block">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-main border border-line-subtle rounded-xl text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-brand-accent transition"
                  />
                </div>
              </div>

              {/* Leave Reason Text area */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-content-secondary block">
                  Leave Reason Details
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide supporting notes for your request..."
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-main border border-line-subtle rounded-xl text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-brand-accent transition resize-none leading-relaxed"
                />
              </div>

              {/* Controls bar */}
              <div className="flex justify-end items-center gap-2 pt-4 border-t border-line-subtle">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-content-secondary hover:text-content-main bg-surface-main hover:bg-line-subtle rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-accent hover:bg-brand-hover rounded-xl shadow-md transition"
                >
                  Dispatch Request
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}