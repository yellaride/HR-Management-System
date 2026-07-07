"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import { 
  CalendarCheck, 
  Clock, 
  FileText, 
  Fingerprint, 
  CalendarPlus, 
  X, 
  CheckCircle2,
  CalendarDays,
  AlertCircle,
  AlertTriangle,
  LogIn,
  LogOut,
  ChevronDown
} from "lucide-react";
import { useSession } from "next-auth/react";
import PayslipList from "@/app/components/payslips/PayslipList";
import { PayslipRecord } from "@/app/components/payslips/payslipPdf";
import { CountUp } from "@/app/components/admin/StatCard";



const swalCustomClass = {
  popup: "bg-white rounded-2xl border border-[var(--color-line-subtle)] shadow-xl font-sans",
  title: "text-sm font-bold text-[var(--color-content-main)]",
  htmlContainer: "text-xs text-[var(--color-content-secondary)]",
  confirmButton: "px-4.5 py-2.5 text-xs font-bold rounded-xl text-white bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-hover)] border-none outline-none cursor-pointer transition",
};

function DynamicHeaderClock() {
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDateTime(new Date());
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!currentDateTime) {
    return <span className="text-xs font-semibold text-[var(--color-content-muted)]">Loading time...</span>;
  }

  return (
    <span className="text-xs font-semibold text-[var(--color-content-secondary)] tabular-nums">
      {currentDateTime.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
      })}{" "}
      •{" "}
      {currentDateTime.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      })}
    </span>
  );
}

export default function EmployeeDashboardPage() {
  const { data: session } = useSession();
  const leaveTypeRef = useRef<HTMLDivElement>(null);

  // Core Metrics State
  const [presentDays, setPresentDays] = useState(18);
  const [pendingLeaves, setPendingLeaves] = useState(2);
  const [payslips, setPayslips] = useState<PayslipRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Attendance Integration States
  const [todayRecord, setTodayRecord] = useState<any | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  // Time & Constraints Validation
  const [isSunday, setIsSunday] = useState(false);
  const [isWithinWindow, setIsWithinWindow] = useState(false);

  // Interactivity state
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isLeaveTypeDropdownOpen, setIsLeaveTypeDropdownOpen] = useState(false);
  const [leaveAppliedNotice, setLeaveAppliedNotice] = useState(false);

  // Form parameters
  const [leaveForm, setLeaveForm] = useState({
    type: "Annual Leave",
    startDate: "",
    endDate: "",
    reason: "",
  });

  // Evaluate operational shift hour constraints (11:30 AM to 8:30 PM)
  const evaluateTimeConstraints = useCallback(() => {
    const now = new Date();
    const day = now.getDay();
    
    if (day === 0) {
      setIsSunday(true);
      setIsWithinWindow(false);
      return;
    }
    
    setIsSunday(false);
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentMins = hours * 60 + minutes;

    const startLimit = 11 * 60 + 30; // 11:30 AM
    const endLimit = 20 * 60 + 30;   // 8:30 PM

    setIsWithinWindow(currentMins >= startLimit && currentMins <= endLimit);
  }, []);

  // Fetch attendance logs
  const fetchAttendanceStatus = useCallback(async () => {
    try {
      setAttendanceLoading(true);
      const res = await fetch("/api/employee/attendance");
      if (res.ok) {
        const data = await res.json();
        setTodayRecord(data.todayRecord || null);
        
        if (data.history && data.history.length > 0) {
          const actualPresents = data.history.filter(
            (r: any) => r.status === "On Time" || r.status === "Late"
          ).length;
          setPresentDays(actualPresents);
        }
      }
    } catch (err) {
      console.error("Failed to sync attendance status", err);
    } finally {
      setAttendanceLoading(false);
    }
  }, []);

  // Attendance Clock-in Actions
  const handleAttendanceAction = async (actionType: "check-in" | "check-out") => {
    try {
      setAttendanceError(null);
      const res = await fetch("/api/employee/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAttendanceError(data.error || "Action execution failed.");
      } else {
        await fetchAttendanceStatus();
      }
    } catch {
      setAttendanceError("A communication error occurred with the server.");
    }
  };

  // Self-healing, resilient payslip fetching routine
  const fetchEmployeePayslips = useCallback(async () => {
    if (!session?.user?.email) return;

    try {
      setIsLoading(true);
      
      // Step 1: Attempt dedicated employee scoped endpoint
      let res = await fetch("/api/employee/payslips");
      let isEmployeeScopedEndpoint = true;

      if (!res.ok) {
        console.warn(`Dedicated employee API returned status ${res.status}. Falling back to general query...`);
        // Fallback to administrator query if employee-specific route is not configured
        res = await fetch("/api/admin/payslips");
        isEmployeeScopedEndpoint = false;
      }

      if (!res.ok) {
        throw new Error(`Failed to load payslips from API paths (status: ${res.status})`);
      }

      const data = await res.json();
      
      // Extract structure array securely
      let slips: PayslipRecord[] = [];
      if (Array.isArray(data)) {
        slips = data;
      } else if (Array.isArray(data.payslips)) {
        slips = data.payslips;
      } else if (Array.isArray(data.data)) {
        slips = data.data;
      }

      // Step 2: Conditionally filter if fetching from administrative fallback route
      if (!isEmployeeScopedEndpoint) {
        const currentUserEmail = (session.user as any)?.email?.toLowerCase?.().trim();
        const currentUserName = (session.user as any)?.name?.toLowerCase?.().trim() || "";


        slips = slips.filter((slip: PayslipRecord) => {
          const empObj = typeof slip.employeeId === "object" && slip.employeeId !== null ? slip.employeeId : null;
          const empName = (empObj?.name || slip.employeeName || "").toLowerCase().trim();
          const empEmail = (empObj as any)?.email || (slip as any).employeeEmail || "";
          const empEmailStr = String(empEmail).toLowerCase().trim();

          const emailMatches = empEmail && currentUserEmail && empEmail === currentUserEmail;
          const nameMatches = empName && currentUserName && empName === currentUserName;

          return emailMatches || nameMatches;
        });
      }

      setPayslips(slips);
    } catch (error) {
      console.error("Error fetching employee payslips:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session]);


  useEffect(() => {
    fetchEmployeePayslips();
    fetchAttendanceStatus();
    evaluateTimeConstraints();

    const timer = setInterval(() => {
      evaluateTimeConstraints();
    }, 15000);

    return () => clearInterval(timer);
  }, [fetchEmployeePayslips, fetchAttendanceStatus, evaluateTimeConstraints]);

  // Click tracking outside leave dropdown
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (leaveTypeRef.current && !leaveTypeRef.current.contains(event.target as Node)) {
        setIsLeaveTypeDropdownOpen(false);
      }
    }
    if (isLeaveTypeDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isLeaveTypeDropdownOpen]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      currencyDisplay: "symbol",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace(/\u0024/g, "");
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) return;

    setPendingLeaves(prev => prev + 1);
    setIsLeaveModalOpen(false);
    setLeaveAppliedNotice(true);

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

  const isShiftButtonsDisabled = isSunday || !isWithinWindow;

  return (
    <div className="min-h-screen bg-[var(--color-surface-main)] text-[var(--color-content-main)] antialiased py-4 lg:py-8 md:py-6">
      <div className="w-full max-w-6xl mx-auto px-4">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[var(--color-line-subtle)]">
          <div>
                          <span className="h-2 w-2 rounded-full bg-[var(--color-brand-accent)] animate-pulse" />

            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand-accent)]">
                Employee Portal
              </span>
            <h1 className="text-2xl font-black tracking-tight text-[var(--color-content-main)] sm:text-3xl">
              Employee Dashboard
            </h1>
            <p className="mt-1 text-xs text-[var(--color-content-secondary)]">
              Overview of your current work schedule, salary statements, and attendance records.
            </p>
          </div>

          <div className="self-start md:self-center inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--color-surface-card)] border border-[var(--color-line-subtle)] rounded-full text-xs font-semibold shadow-xs">
            <CalendarDays className="w-4 h-4 text-[var(--color-brand-accent)]" />
            <DynamicHeaderClock />
          </div>
        </div>

        {/* Notices */}
        {leaveAppliedNotice && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Leave Application Received</span>
              <p className="text-[11px] text-emerald-700 mt-0.5">Your request was submitted and is undergoing administration evaluation.</p>
            </div>
          </div>
        )}

        {/* Metric Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="panel panel-section flex flex-col justify-between hover:shadow-md hover:border-[var(--color-brand-accent)]/30 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-content-muted)]">
                Attendance Period
              </span>
              <div className="p-2.5 rounded-xl bg-[var(--color-brand-subtle)] text-[var(--color-brand-accent)] border border-[var(--color-line-subtle)]">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-black text-[var(--color-content-main)] block tracking-tight">
                <CountUp end={presentDays} /> <span className="text-sm font-normal text-[var(--color-content-muted)]">/ 30 Days</span>

              </span>
              <span className="text-[11px] text-[var(--color-content-secondary)] block mt-2">
                Active working shifts recorded this cycle.
              </span>
            </div>
          </div>

          <div className="panel panel-section flex flex-col justify-between hover:shadow-md hover:border-amber-300 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-content-muted)]">
                Leave Requests
              </span>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-black text-[var(--color-content-main)] block tracking-tight">
                <CountUp end={pendingLeaves} /> <span className="text-sm font-normal text-[var(--color-content-muted)]">Pending</span>

              </span>
              <span className="text-[11px] text-[var(--color-content-secondary)] block mt-2">
                Days currently awaiting coordinator approval.
              </span>
            </div>
          </div>

          <div className="panel panel-section flex flex-col justify-between hover:shadow-md hover:border-teal-300 transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-content-muted)]">
                Latest Net Payout
              </span>
              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-3xl font-black text-[var(--color-content-main)] block tracking-tight">
                {payslips[0] ? formatCurrency(payslips[0].netPay) : "—"}
              </span>
              <span className="text-[11px] text-[var(--color-content-secondary)] block mt-2">
                {payslips[0] ? `Dispatched statement for ${payslips[0].period}.` : "No payslips available yet."}
              </span>
            </div>
          </div>

        </div>

        {/* Grid Split Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h2 className="text-[10px] font-bold tracking-wider text-[var(--color-content-muted)] uppercase">
                Recent Pay Statements
              </h2>
            </div>
            
            <PayslipList
              payslips={payslips}
              isLoading={isLoading}
              downloadingId={downloadingId}
              onDownloadStart={(id) => setDownloadingId(id)}
              onDownloadEnd={() => setDownloadingId(null)}
              title="Statement Dispatch History"
              emptyMessage="No dispatch records are mapped to your account yet."
              formatCurrency={formatCurrency}
              showEmployeeColumn={false}
            />
          </div>

          <div className="lg:col-span-1 space-y-4">
            <div>
              <h2 className="text-[10px] font-bold tracking-wider text-[var(--color-content-muted)] uppercase">
                Daily Actions Console
              </h2>
            </div>

            <div className="panel panel-section space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[var(--color-content-main)]">Shift Activity Panel</h3>
                <p className="text-xs text-[var(--color-content-secondary)] mt-0.5">Register daily workspace entries or request planned leaves.</p>
              </div>

              {isSunday && (
                <div className="alert-warn">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-[10px] leading-relaxed font-semibold text-amber-800">
                    Today is Sunday. Weekly off, attendance operations are locked.
                  </span>
                </div>
              )}

              {!isSunday && !isWithinWindow && (
                <div className="alert-warn">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-[10px] leading-relaxed font-semibold text-amber-800">
                    Interactive panel is open only within shift margins (11:30 AM to 08:30 PM).
                  </span>
                </div>
              )}

              {attendanceError && (
                <div className="w-full flex items-start gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-left">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-[10px] leading-relaxed font-semibold text-rose-800">{attendanceError}</span>
                </div>
              )}

              <div className="p-4 bg-[var(--color-surface-main)] rounded-xl border border-[var(--color-line-subtle)] space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-[var(--color-surface-card)] border border-[var(--color-line-subtle)] rounded-lg text-[var(--color-brand-accent)] mt-0.5">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-[var(--color-content-main)] block">Self Service Shifts</span>
                    {todayRecord ? (
                      <p className="text-[11px] text-[var(--color-content-secondary)] mt-0.5">
                        Active checked-in session tracked for today.
                      </p>
                    ) : (
                      <p className="text-[11px] text-[var(--color-content-secondary)] mt-0.5">
                        Register today's clock-in time to update database logs.
                      </p>
                    )}
                  </div>
                </div>

                {attendanceLoading ? (
                  <div className="text-center py-2 text-[11px] text-[var(--color-content-muted)]">
                    Checking database shift parameters...
                  </div>
                ) : !todayRecord ? (
                  <button
                    disabled={isShiftButtonsDisabled}
                    onClick={() => handleAttendanceAction("check-in")}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 ${
                      isShiftButtonsDisabled 
                        ? "bg-[var(--color-surface-main)] text-[var(--color-content-muted)] border border-[var(--color-line-subtle)] cursor-not-allowed" 
                        : "bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-hover)] text-white shadow-xs cursor-pointer"
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Register Daily Check-In</span>
                  </button>
                ) : !todayRecord.checkOut ? (
                  <button
                    disabled={isShiftButtonsDisabled}
                    onClick={() => handleAttendanceAction("check-out")}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 ${
                      isShiftButtonsDisabled 
                        ? "bg-[var(--color-surface-main)] text-[var(--color-content-muted)] border border-[var(--color-line-subtle)] cursor-not-allowed" 
                        : "bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Register Daily Check-Out</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-lg text-center text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Daily Session Completed</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-[var(--color-surface-card)] hover:bg-[var(--color-surface-main)] border border-[var(--color-line-subtle)] text-[var(--color-content-secondary)] hover:text-[var(--color-content-main)] text-xs font-bold rounded-lg shadow-xs transition duration-150 cursor-pointer"
              >
                <CalendarPlus className="w-4 h-4 text-[var(--color-content-muted)]" />
                <span>Apply for Leaves</span>
              </button>
            </div>
          </div>

        </div>

        {/* Modal Apply for Leaves */}
        {isLeaveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-slate-900/35 backdrop-blur-xs transition-opacity duration-150" 
              onClick={() => setIsLeaveModalOpen(false)} 
            />
            
            <div className="relative bg-[var(--color-surface-card)] border border-[var(--color-line-subtle)] rounded-2xl max-w-md w-full p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
              
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[var(--color-brand-accent)] to-[var(--color-brand-hover)]" />

              <div className="flex items-center justify-between pb-4 border-b border-[var(--color-line-subtle)]">
                <div>
                  <h2 className="text-base font-extrabold text-[var(--color-content-main)]">Apply for Leaves</h2>
                  <p className="text-xs text-[var(--color-content-secondary)] mt-0.5">Specify request parameter fields for manager review.</p>
                </div>
                <button 
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="p-1.5 rounded-lg text-[var(--color-content-muted)] hover:text-[var(--color-brand-accent)] hover:bg-[var(--color-brand-subtle)] transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleLeaveSubmit} className="space-y-4 pt-4">
                
                {/* Leave Type Select with custom design tokens */}
                <div className="space-y-1.5 relative" ref={leaveTypeRef}>
                  <label className="field-label block">Leave Type</label>
                  <button
                    type="button"
                    onClick={() => setIsLeaveTypeDropdownOpen(!isLeaveTypeDropdownOpen)}
                    className="dropdown-trigger flex items-center justify-between text-left cursor-pointer z-40 relative"
                  >
                    <span>{leaveForm.type}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[var(--color-content-muted)] transition-transform duration-200 ${isLeaveTypeDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isLeaveTypeDropdownOpen && (
                    <div className="dropdown-panel absolute left-0 right-0 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-150 max-h-40 overflow-y-auto z-50">
                      {["Annual Leave", "Sick Leave", "Casual Leave", "Unpaid Leave"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setLeaveForm({ ...leaveForm, type });
                            setIsLeaveTypeDropdownOpen(false);
                          }}
                          className={`dropdown-option ${leaveForm.type === type ? "dropdown-option-active" : ""}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="field-label block">Start Date</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      className="form-input text-xs cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="field-label block">End Date</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      className="form-input text-xs cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="field-label block">Reason for Request</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Scheduled medical procedure, personal travel..."
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    className="form-input text-xs resize-none leading-relaxed"
                  />
                </div>

                <div className="flex justify-end items-center gap-3 pt-4 border-t border-[var(--color-line-subtle)]">
                  <button
                    type="button"
                    onClick={() => setIsLeaveModalOpen(false)}
                    className="px-4.5 py-2.5 text-xs font-bold text-[var(--color-content-secondary)] bg-[var(--color-surface-main)] hover:bg-[var(--color-brand-subtle)] hover:text-[var(--color-brand-accent)] rounded-xl border border-[var(--color-line-subtle)] transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-2.5 text-xs font-bold text-white bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-hover)] rounded-xl shadow-xs hover:shadow-md transition duration-150 cursor-pointer"
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