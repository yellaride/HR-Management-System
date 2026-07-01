"use client";

import React, { useState, useEffect } from "react";
import { 
  CalendarCheck, 
  Clock, 
  FileText, 
  Fingerprint, 
  CalendarPlus, 
  X, 
  CheckCircle2,
  CalendarDays
} from "lucide-react";
import { useSession } from "next-auth/react";
import PayslipList from "@/app/components/payslips/PayslipList";
import { PayslipRecord } from "@/app/components/payslips/payslipPdf";

export default function EmployeeDashboardPage() {
  const { data: session } = useSession();

  // Page Metrics State
  const [presentDays, setPresentDays] = useState(18);
  const [pendingLeaves, setPendingLeaves] = useState(2);
  const [payslips, setPayslips] = useState<PayslipRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchEmployeePayslips = async () => {
      if (!session?.user?.email) return;

      try {
        setIsLoading(true);
        const response = await fetch("/api/admin/payslips");
        if (!response.ok) throw new Error("Failed to load payslips");

        const data = await response.json();
        const slips = Array.isArray(data) ? data : data.payslips || [];
        const visibleSlips = slips.filter((slip: PayslipRecord) => {
          const employeeName = typeof slip.employeeId === "object" && slip.employeeId !== null
            ? slip.employeeId.name
            : slip.employeeName;
          return employeeName?.toLowerCase() === session.user.name?.toLowerCase();
        });
        setPayslips(visibleSlips);
      } catch (error) {
        console.error("Error fetching employee payslips:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployeePayslips();
  }, [session?.user?.email, session?.user?.name]);

  // Calculate currency format
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      currencyDisplay: "symbol",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace(/\u0024/g, "");
  };

  // Marks today's check-in
  const handleMarkAttendance = () => {
    if (attendanceMarked) return;
    
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
    <div className="min-h-screen bg-slate-50/50 text-slate-900 antialiased py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* 1. Header Area */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Employee Dashboard
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Overview of your current work schedule, salary statements, and attendance records.
            </p>
          </div>

          {/* Dynamic Status Pill */}
          <div className="self-start md:self-center inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 shadow-sm">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <span>June 17, 2026</span>
          </div>
        </div>

        {/* Action Notification Message */}
        {leaveAppliedNotice && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Leave Application Pending</span>
              <p className="text-xs text-emerald-700 mt-0.5">Your request was submitted and is undergoing administration evaluation.</p>
            </div>
          </div>
        )}

        {/* 2. Top Metric Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Present Days Card */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Attendance Period
              </span>
              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-bold text-slate-900 block">
                {presentDays} <span className="text-base font-normal text-slate-400">/ 22 Days</span>
              </span>
              <span className="text-xs text-slate-500 block mt-2">
                Active working shifts recorded this cycle.
              </span>
            </div>
          </div>

          {/* Pending Leaves Card */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Leave Requests
              </span>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-bold text-slate-900 block">
                {pendingLeaves} <span className="text-base font-normal text-slate-400">Pending</span>
              </span>
              <span className="text-xs text-slate-500 block mt-2">
                Days currently awaiting coordinator approval.
              </span>
            </div>
          </div>

          {/* Latest Payslip Summary */}
          <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                Latest Net Payout
              </span>
              <div className="p-2.5 rounded-xl bg-teal-50 border border-teal-100 text-teal-600">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-bold text-slate-900 block">
                {payslips[0] ? formatCurrency(payslips[0].netPay) : "—"}
              </span>
              <span className="text-xs text-slate-500 block mt-2">
                {payslips[0] ? `Dispatched statement for ${payslips[0].period}.` : "No payslips available yet."}
              </span>
            </div>
          </div>

        </div>

        {/* 3. Main Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Payslips History Block */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Recent Pay Statements
              </h2>
            </div>
            
            <PayslipList
              payslips={payslips}
              isLoading={isLoading}
              downloadingId={downloadingId}
              onDownloadStart={(id) => setDownloadingId(id)}
              onDownloadEnd={() => setDownloadingId(null)}
              title="Recent Pay Statements"
              emptyMessage="No payslips are available for your account yet."
              formatCurrency={formatCurrency}
            />
          </div>

          {/* Right Column: Daily Action Card Console */}
          <div className="lg:col-span-1 space-y-4">
            <div>
              <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                Daily Actions Console
              </h2>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Activity Panel</h3>
                <p className="text-xs text-slate-500 mt-1">Register daily workspace entries or request planned leaves.</p>
              </div>

              {/* Attendance & Check-In Action Section */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 mt-0.5">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">Self Service Check-In</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Register today's clock-in time to update database logs.</p>
                  </div>
                </div>

                <button
                  disabled={attendanceMarked}
                  onClick={handleMarkAttendance}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold shadow-sm transition-all duration-150 flex items-center justify-center gap-2 ${
                    attendanceMarked 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default" 
                      : "bg-indigo-600 hover:bg-indigo-700 text-white border border-transparent"
                  }`}
                >
                  {attendanceMarked ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Checked In at {checkInTime}</span>
                    </>
                  ) : (
                    <span>Mark Daily Attendance</span>
                  )}
                </button>
              </div>

              {/* Leaves Action Trigger */}
              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-950 text-xs font-semibold rounded-lg shadow-sm transition duration-150"
              >
                <CalendarPlus className="w-4 h-4 text-slate-500" />
                <span>Apply for Leaves</span>
              </button>
            </div>
          </div>

        </div>

        {/* 4. Apply for Leaves Modal */}
        {isLeaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop blur overlay */}
            <div 
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-150" 
              onClick={() => setIsLeaveModalOpen(false)} 
            />
            
            <div className="relative bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Apply for Leaves</h2>
                  <p className="text-xs text-slate-500 mt-1">Specify request parameter fields for manager review.</p>
                </div>
                <button 
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleLeaveSubmit} className="space-y-4 pt-4">
                {/* Leave Type Select */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Leave Type
                  </label>
                  <select
                    value={leaveForm.type}
                    onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition cursor-pointer"
                  >
                    <option value="Annual Leave">Annual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Unpaid Leave">Unpaid Leave</option>
                  </select>
                </div>

                {/* Start & End Dates Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      End Date
                    </label>
                    <input
                      type="date"
                      required
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                {/* Reason Input */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Reason for Request
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Scheduled medical procedure, personal travel, family emergency..."
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none leading-relaxed"
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsLeaveModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}