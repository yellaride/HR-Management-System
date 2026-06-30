"use client";

import React, { useState } from "react";
import { 
  CalendarCheck, 
  Clock, 
  FileText, 
  Fingerprint, 
  CalendarPlus, 
  Download, 
  X, 
  AlertCircle,
  CheckCircle2,
  CalendarDays
} from "lucide-react";

interface MockPayslip {
  id: number;
  period: string;
  netSalary: number;
  status: string;
  releaseDate: string;
}

const initialPayslips: MockPayslip[] = [
  { id: 1, period: "May 2026", netSalary: 4540, status: "Released", releaseDate: "May 31, 2026" },
  { id: 2, period: "April 2026", netSalary: 4540, status: "Released", releaseDate: "April 30, 2026" },
  { id: 3, period: "March 2026", netSalary: 4420, status: "Released", releaseDate: "March 31, 2026" },
];

export default function EmployeeDashboardPage() {
  // Page Metrics State
  const [presentDays, setPresentDays] = useState(18);
  const [pendingLeaves, setPendingLeaves] = useState(2);
  const [payslips, setPayslips] = useState<MockPayslip[]>(initialPayslips);

  // Interaction States
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [checkInTime, setCheckInTime] = useState("");
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveAppliedNotice, setLeaveAppliedNotice] = useState(false);

  // Form State for Leave Application
  const [leaveForm, setLeaveForm] = useState({
    type: "Annual Leave",
    startDate: "",
    endDate: "",
    reason: "",
  });

  // Calculate currency format
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Marks today's check-in
  const handleMarkAttendance = () => {
    if (attendanceMarked) return;
    
    // Set check-in date and append present count
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setCheckInTime(timeNow);
    setPresentDays(prev => prev + 1);
    setAttendanceMarked(true);
  };

  // Submit leave request and update dashboard totals
  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) return;

    setPendingLeaves(prev => prev + 1);
    setIsLeaveModalOpen(false);
    setLeaveAppliedNotice(true);

    // Reset Form Fields
    setLeaveForm({
      type: "Annual Leave",
      startDate: "",
      endDate: "",
      reason: "",
    });

    setTimeout(() => {
      setLeaveAppliedNotice(false);
    }, 4000);
  };

  return (
    <div className=" pt-4 pb-12 bg-surface-main min-h-screen">
      
      {/* 1. Header Area */}
      <div className="pb-6 border-b border-line-subtle flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-content-main tracking-tight">Employee Dashboard</h1>
          <p className="mt-1 text-xs text-content-secondary">
            Your tasks, schedule, salary history, and scheduling metrics.
          </p>
        </div>

        {/* Dynamic Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface-card border border-line-subtle rounded-xl text-xs font-semibold text-content-secondary shadow-xs">
          <CalendarDays className="w-4 h-4 text-brand-accent" />
          <span>June 17, 2026</span>
        </div>
      </div>

      {/* Action Notification Message */}
      {leaveAppliedNotice && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Your leave request has been submitted to Human Resources for review.</span>
        </div>
      )}

      {/* 2. Top Metric Cards Row (Total Present, Pending Leaves, Latest Net Salary) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Present Days Card */}
        <div className="p-6 rounded-2xl border border-line-subtle bg-surface-card shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-content-muted">
              Monthly Attendance
            </span>
            <div className="p-2.5 rounded-xl bg-brand-subtle/40 border border-brand-subtle text-brand-accent">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-content-main block">
              {presentDays} <span className="text-sm font-semibold text-content-secondary">/ 22 Days</span>
            </span>
            <span className="text-[10px] text-content-secondary font-medium block mt-1">
              Active working days recorded this month.
            </span>
          </div>
        </div>

        {/* Pending Leaves Card */}
        <div className="p-6 rounded-2xl border border-line-subtle bg-surface-card shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-content-muted">
              Pending Leave Days
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-content-main block">
              {pendingLeaves} <span className="text-sm font-semibold text-content-secondary">Requests</span>
            </span>
            <span className="text-[10px] text-content-secondary font-medium block mt-1">
              Awaiting administration authorization.
            </span>
          </div>
        </div>

        {/* Latest Payslip Summary */}
        <div className="p-6 rounded-2xl border border-line-subtle bg-surface-card shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-content-muted">
              Latest Net Payout
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-content-main block">
              {formatCurrency(payslips[0].netSalary)}
            </span>
            <span className="text-[10px] text-content-secondary font-medium block mt-1">
              Dispatched payout for {payslips[0].period}.
            </span>
          </div>
        </div>

      </div>

      {/* 3. Main Split Grid (Recent Payslips Left, Dynamic Console Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Payslips History Block */}
        <div className="lg:col-span-2 space-y-4">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-content-muted">
            Recent Payslips
          </div>
          
          <div className="border border-line-subtle bg-surface-card rounded-2xl shadow-sm overflow-hidden">
            <div className="divide-y divide-line-subtle">
              {payslips.map((slip) => (
                <div key={slip.id} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-surface-main/30 transition">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-subtle/50 text-brand-accent rounded-xl border border-brand-subtle">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-content-main block text-sm leading-tight">
                        Salary Slip • {slip.period}
                      </span>
                      <span className="text-[10px] text-content-muted mt-0.5 block">
                        Released on {slip.releaseDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-right">
                      <span className="font-extrabold text-content-main text-sm block">
                        {formatCurrency(slip.netSalary)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wide text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                        {slip.status}
                      </span>
                    </div>

                    <button 
                      onClick={() => alert(`Initiated download request for ${slip.period} payslip.`)}
                      className="px-3 py-1.5 text-xs font-semibold text-brand-accent bg-brand-subtle border border-brand-subtle hover:bg-brand-accent hover:text-white rounded-lg transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Action Card Console */}
        <div className="lg:col-span-1 space-y-4">
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-content-muted">
            Daily Actions Console
          </div>

          <div className="p-6 rounded-2xl border border-line-subtle bg-surface-card shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-content-main">Activity Panel</h3>
              <p className="text-[11px] text-content-secondary mt-1">Perform daily check-ins and request leave.</p>
            </div>

            {/* Attendance & Check-In Action Section */}
            <div className="p-4 bg-surface-main rounded-xl border border-line-subtle space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-surface-card border border-line-subtle rounded-lg text-content-secondary mt-0.5">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-content-main block">Self Service Check-In</span>
                  <p className="text-[10px] text-content-muted mt-0.5">Register today's clock-in time to update records.</p>
                </div>
              </div>

              {/* Checks status of attendance mark using custom global utilities */}
              <button
                disabled={attendanceMarked}
                onClick={handleMarkAttendance}
                className={attendanceMarked ? "btn-brand-subtle cursor-default pointer-events-none" : "btn-brand-filled"}
              >
                {attendanceMarked ? (
                  <span>Checked In at {checkInTime}</span>
                ) : (
                  <span>Mark Attendance</span>
                )}
              </button>
            </div>

            {/* Leaves Action trigger using custom outline utility */}
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="btn-outline flex items-center justify-center gap-2"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Apply for Leaves</span>
            </button>
          </div>
        </div>

      </div>

      {/* 4. Apply for Leaves Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-content-main/50 backdrop-blur-xs" onClick={() => setIsLeaveModalOpen(false)} />
          
          <div className="relative bg-surface-card border border-line-subtle rounded-2xl max-w-md w-full p-6 shadow-xl z-10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-line-subtle">
              <div>
                <h2 className="text-base font-bold text-content-main">Apply for Leaves</h2>
                <p className="text-xs text-content-secondary mt-0.5">Fill in parameters to dispatch request.</p>
              </div>
              <button 
                onClick={() => setIsLeaveModalOpen(false)}
                className="p-1.5 rounded-lg text-content-muted hover:text-content-main hover:bg-surface-main transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLeaveSubmit} className="space-y-4 pt-4">
              {/* Leave Type Select */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-content-secondary block">
                  Leave Type
                </label>
                <select
                  value={leaveForm.type}
                  onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-main border border-line-subtle rounded-xl text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-brand-accent transition cursor-pointer"
                >
                  <option value="Annual Leave">Annual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Unpaid Leave">Unpaid Leave</option>
                </select>
              </div>

              {/* Start & End Dates Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-content-secondary block">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
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
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-surface-main border border-line-subtle rounded-xl text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-brand-accent transition"
                  />
                </div>
              </div>

              {/* Reason Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-content-secondary block">
                  Reason for Request
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Relocating, personal family matters, dental appointment..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-surface-main border border-line-subtle rounded-xl text-xs text-content-main focus:outline-none focus:ring-2 focus:ring-brand-accent transition resize-none leading-relaxed"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end items-center gap-2 pt-4 border-t border-line-subtle">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-content-secondary hover:text-content-main bg-surface-main hover:bg-line-subtle rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-brand-accent hover:bg-brand-hover rounded-xl shadow-md transition"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}