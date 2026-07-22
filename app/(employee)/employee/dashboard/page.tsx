"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import { 
  CalendarCheck, 
  Clock, 
  Fingerprint, 
  CalendarPlus, 
  X, 
  CheckCircle2,
  CalendarDays,
  AlertCircle,
  AlertTriangle,
  LogIn,
  LogOut,
  ChevronDown,
  UserMinus,
  Activity
} from "lucide-react";
import { useSession } from "next-auth/react";
import PayslipList from "@/app/components/payslips/PayslipList";
import { PayslipRecord } from "@/app/components/payslips/payslipPdf";
import {MetricCard} from "@/app/components/admin/dashbord/MetricCard";
import BirthdayGreetingBanner from "@/app/components/employee/dashbord/BirthdayGreetingBanner";

// Minimal shapes of the API payload fields actually consumed by this page
interface TodayAttendanceRecord {
  checkOut?: string;
}

interface AttendanceHistoryEntry {
  status?: string;
  workedHours?: number;
}

interface EmployeeLeaveSummary {
  status?: string;
}

const swalCustomClass = {
  popup: "bg-white rounded-2xl border border-line-subtle shadow-xl font-sans",
  title: "text-sm font-bold text-content-main",
  htmlContainer: "text-xs text-content-secondary",
  confirmButton: "px-4.5 py-2.5 text-xs font-bold rounded-xl text-white bg-brand-accent hover:bg-brand-hover border-none outline-none cursor-pointer transition",
};

function DynamicHeaderClock() {
  const [currentDateTime, setCurrentDateTime] = useState<Date | null>(null);

  useEffect(() => {
    const initial = setTimeout(() => setCurrentDateTime(new Date()), 0);
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, []);

  if (!currentDateTime) {
    return <span className="text-xs font-semibold text-content-muted">Loading time...</span>;
  }

  return (
    <span className="text-xs font-semibold text-content-secondary tabular-nums">
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

  const [presentDays, setPresentDays] = useState(0);
  const [absentDays, setAbsentDays] = useState(0);
  const [totalWorkedHours, setTotalWorkedHours] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  
  const [payslips, setPayslips] = useState<PayslipRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [todayRecord, setTodayRecord] = useState<TodayAttendanceRecord | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const [isSunday, setIsSunday] = useState(false);
  const [isWithinWindow, setIsWithinWindow] = useState(false);

  const [isBirthday, setIsBirthday] = useState(false);
  const [birthdayName, setBirthdayName] = useState("");

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isLeaveTypeDropdownOpen, setIsLeaveTypeDropdownOpen] = useState(false);
  const [leaveAppliedNotice, setLeaveAppliedNotice] = useState(false);

  const [leaveForm, setLeaveForm] = useState({
    type: "Annual Leave",
    startDate: "",
    endDate: "",
    reason: "",
  });

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

    const startLimit = 11 * 60 + 30;
    const endLimit = 20 * 60 + 30;

    setIsWithinWindow(currentMins >= startLimit && currentMins <= endLimit);
  }, []);

  const fetchAttendanceStatus = useCallback(async () => {
    try {
      // `attendanceLoading` starts as true, so the initial fetch already
      // renders the loading state; refresh callers set it before invoking.
      const res = await fetch("/api/employee/attendance");
      if (res.ok) {
        const data = await res.json();
        setTodayRecord(data.todayRecord || null);
        
        if (data.monthlyRecord) {
          setPresentDays(data.monthlyRecord.presentDays ?? 0);
          setAbsentDays(data.monthlyRecord.absentDays ?? 0);
          setTotalWorkedHours(data.monthlyRecord.totalWorkingHours ?? 0);

        } else if (data.history && data.history.length > 0) {
          const actualPresents = data.history.filter(
            (r: AttendanceHistoryEntry) => r.status === "On Time" || r.status === "Late"
          ).length;
          setPresentDays(actualPresents);
          
          const actualAbsents = data.history.filter(
            (r: AttendanceHistoryEntry) => r.status === "Absent"
          ).length;
          setAbsentDays(actualAbsents);

          const totalHours = data.history.reduce((acc: number, curr: AttendanceHistoryEntry) => {
            return acc + (curr.workedHours || 0);
          }, 0);
          setTotalWorkedHours(totalHours || actualPresents * 8); 
        }
      }
    } catch (err) {
      console.error("Failed to sync attendance status", err);
    } finally {
      setAttendanceLoading(false);
    }
  }, []);

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
        setAttendanceLoading(true);
        await fetchAttendanceStatus();
      }
    } catch {
      setAttendanceError("A communication error occurred with the server.");
    }
  };

  const fetchEmployeePayslips = useCallback(async () => {
    if (!session?.user?.email) return;

    try {
      // `isLoading` starts as true, so the initial fetch already renders
      // the loading state without setting it again here.
      const res = await fetch("/api/employee/payslips");

      if (!res.ok) {
        throw new Error(`Failed to load payslips (status: ${res.status})`);
      }

      const data = await res.json();

      let slips: PayslipRecord[] = [];
      if (Array.isArray(data)) {
        slips = data;
      } else if (Array.isArray(data.payslips)) {
        slips = data.payslips;
      } else if (Array.isArray(data.data)) {
        slips = data.data;
      }

      setPayslips(slips);
    } catch (error) {
      console.error("Error fetching employee payslips:", error);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const fetchPendingLeaves = useCallback(async () => {
    try {
      const res = await fetch("/api/employee/leaves-request");
      if (!res.ok) return;
      const data = await res.json();
      const leaves = Array.isArray(data?.leaves) ? data.leaves : (Array.isArray(data) ? data : []);
      const pendingCount = leaves.filter((l: EmployeeLeaveSummary) => String(l?.status || "").toUpperCase() === "PENDING").length;
      setPendingLeaves(pendingCount);
    } catch (e) {
      console.error("Failed to fetch pending leaves", e);
    }
  }, []);

  const fetchBirthdayStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/employee/my-birthday");
      if (res.ok) {
        const data = await res.json();
        setIsBirthday(!!data.isBirthday);
        setBirthdayName(data.name || "");
      }
    } catch (e) {
      console.error("Failed to fetch birthday validation values:", e);
    }
  }, []);

  useEffect(() => {
    const initialLoad = setTimeout(() => {
      fetchEmployeePayslips();
      fetchAttendanceStatus();
      fetchPendingLeaves();
      fetchBirthdayStatus();
      evaluateTimeConstraints();
    }, 0);

    const timer = setInterval(() => {
      evaluateTimeConstraints();
    }, 15000);

    return () => {
      clearTimeout(initialLoad);
      clearInterval(timer);
    };
  }, [fetchEmployeePayslips, fetchAttendanceStatus, fetchPendingLeaves, fetchBirthdayStatus, evaluateTimeConstraints]);

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

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) return;

    try {
      const res = await fetch("/api/employee/leaves-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leaveForm),
      });

      if (!res.ok) {
        throw new Error("API call was unsuccessful");
      }

      setIsLeaveModalOpen(false);
      setLeaveAppliedNotice(true);

      await fetchPendingLeaves();

      setLeaveForm({
        type: "Annual Leave",
        startDate: "",
        endDate: "",
        reason: "",
      });

      setTimeout(() => {
        setLeaveAppliedNotice(false);
      }, 4000);

    } catch (err) {
      console.error("Error submitting leave request:", err);
      Swal.fire({
        title: "Error",
        text: "Could not submit your leave application. Please try again.",
        icon: "error",
        customClass: swalCustomClass,
      });
    }
  };

  const isShiftButtonsDisabled = isSunday || !isWithinWindow;
  const attendanceProgressPercentage = Math.min(100, Math.round((presentDays / 30) * 100));

  return (
    <div className="min-h-screen bg-surface-main text-content-main antialiased py-6 md:py-8">
      <div className="w-full max-w-6xl mx-auto px-4 space-y-6">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-line-subtle">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-subtle text-brand-accent text-[10px] font-bold uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent animate-pulse" />
              Employee Portal
            </div>
            <h1 className="text-2xl font-black tracking-tight text-content-main sm:text-3xl">
              Employee Dashboard
            </h1>
            <p className="text-xs text-content-secondary">
              Overview of your current work schedule, salary statements, and attendance records.
            </p>
          </div>

          <div className="self-start md:self-center inline-flex items-center gap-2 px-3 py-1.5 bg-surface-card border border-line-subtle rounded-full text-xs font-semibold shadow-xs">
            <CalendarDays className="w-4 h-4 text-brand-accent" />
            <DynamicHeaderClock />
          </div>
        </div>

        {/* Modular Birthday Banner */}
        <BirthdayGreetingBanner isBirthday={isBirthday} birthdayName={birthdayName} />

        {/* Notice Alerts */}
        {leaveAppliedNotice && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs animate-in fade-in duration-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Leave Application Received</span>
              <p className="text-[11px] text-emerald-700 mt-0.5">Your request was submitted and is undergoing administration evaluation.</p>
            </div>
          </div>
        )}

        {/* Core Metrics Grid using Reusable MetricCard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <MetricCard
            label="Present Days"
            value={presentDays}
            icon={CalendarCheck}
            iconBgClass="bg-emerald-50"
            iconColorClass="text-emerald-600 border-emerald-100"
            subtext="/ 30 Days"
          >
            <div className="space-y-1">
              <div className="w-full bg-surface-main h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${attendanceProgressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-content-muted">
                <span>Attendance Rate</span>
                <span>{attendanceProgressPercentage}%</span>
              </div>
            </div>
          </MetricCard>

          <MetricCard
            label="Absent Days"
            value={absentDays}
            icon={UserMinus}
            iconBgClass="bg-rose-50"
            iconColorClass="text-rose-600 border-rose-100"
            subtext="Days"
          >
            <p className="text-[10px] text-content-secondary leading-relaxed">
              Missed shifts during this payroll lifecycle.
            </p>
          </MetricCard>

          <MetricCard
            label="Worked Hours"
            value={totalWorkedHours}
            icon={Activity}
            iconBgClass="bg-blue-50"
            iconColorClass="text-blue-600 border-blue-100"
            subtext="Hrs"
          >
            <p className="text-[10px] text-content-secondary leading-relaxed">
              Cumulative logged check-in hours this month.
            </p>
          </MetricCard>

          <MetricCard
            label="Leave Requests"
            value={pendingLeaves}
            icon={Clock}
            iconBgClass="bg-amber-50"
            iconColorClass="text-amber-600 border-amber-100"
            subtext="Pending"
          >
            <p className="text-[10px] text-content-secondary leading-relaxed">
              Requests currently awaiting operational sign-off.
            </p>
          </MetricCard>

        </div>

        {/* Grid Split Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Payslips List Segment */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold tracking-wider text-content-muted uppercase">
                Recent Pay Statements
              </h2>
              {payslips[0] && (
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                  Latest: {payslips[0] ? formatCurrency(payslips[0].netPay) : ""}
                </span>
              )}
            </div>
            
            <div className="rounded-2xl border border-line-subtle bg-surface-card overflow-hidden">
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
          </div>

          {/* Actions Console Component */}
          <div className="lg:col-span-1 space-y-4">
            <div>
              <h2 className="text-xs font-bold tracking-wider text-content-muted uppercase">
                Daily Actions Console
              </h2>
            </div>

            <div className="rounded-2xl border border-line-subtle bg-surface-card p-5 space-y-5">
              <div>
                <h3 className="text-sm font-bold text-content-main">Shift Activity Panel</h3>
                <p className="text-[11px] text-content-secondary mt-0.5">Register daily workspace entries or request planned leaves.</p>
              </div>

              {isSunday && (
                <div className="alert-warn flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-snug font-medium text-amber-800">
                    Today is Sunday. Weekly off, attendance operations are locked.
                  </span>
                </div>
              )}

              {!isSunday && !isWithinWindow && (
                <div className="alert-warn flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-snug font-medium text-amber-800">
                    Interactive panel is open only within shift margins (11:30 AM to 08:30 PM).
                  </span>
                </div>
              )}

              {attendanceError && (
                <div className="w-full flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100 text-left">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-snug font-medium text-rose-800">{attendanceError}</span>
                </div>
              )}

              <div className="p-4 bg-surface-main rounded-xl border border-line-subtle space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-surface-card border border-line-subtle rounded-lg text-brand-accent mt-0.5">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-content-main block">Self Service Shifts</span>
                    {todayRecord ? (
                      <p className="text-[11px] text-content-secondary mt-0.5">
                        Active checked-in session tracked for today.
                      </p>
                    ) : (
                      <p className="text-[11px] text-content-secondary mt-0.5">
                        Register today&apos;s clock-in time to update database logs.
                      </p>
                    )}
                  </div>
                </div>

                {attendanceLoading ? (
                  <div className="text-center py-2 text-[11px] text-content-muted">
                    Checking database shift parameters...
                  </div>
                ) : !todayRecord ? (
                  <button
                    disabled={isShiftButtonsDisabled}
                    onClick={() => handleAttendanceAction("check-in")}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 ${
                      isShiftButtonsDisabled 
                        ? "bg-surface-main text-content-muted border border-line-subtle cursor-not-allowed" 
                        : "bg-brand-accent hover:bg-brand-hover text-white shadow-xs cursor-pointer"
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
                        ? "bg-surface-main text-content-muted border border-line-subtle cursor-not-allowed" 
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
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 bg-surface-card hover:bg-surface-main border border-line-subtle text-content-secondary hover:text-content-main text-xs font-bold rounded-lg shadow-xs transition duration-150 cursor-pointer"
              >
                <CalendarPlus className="w-4 h-4 text-content-muted" />
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
            
            <div className="relative bg-surface-card border border-line-subtle rounded-2xl max-w-md w-full p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-150">
              
              <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-brand-accent to-brand-hover" />

              <div className="flex items-center justify-between pb-4 border-b border-line-subtle">
                <div>
                  <h2 className="text-base font-extrabold text-content-main">Apply for Leaves</h2>
                  <p className="text-xs text-content-secondary mt-0.5">Specify request parameter fields for manager review.</p>
                </div>
                <button 
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="p-1.5 rounded-lg text-content-muted hover:text-brand-accent hover:bg-brand-subtle transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleLeaveSubmit} className="space-y-4 pt-4">
                
                <div className="space-y-1.5 relative" ref={leaveTypeRef}>
                  <label className="field-label block">Leave Type</label>
                  <button
                    type="button"
                    onClick={() => setIsLeaveTypeDropdownOpen(!isLeaveTypeDropdownOpen)}
                    className="dropdown-trigger flex items-center justify-between text-left cursor-pointer z-40 relative"
                  >
                    <span>{leaveForm.type}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-content-muted transition-transform duration-200 ${isLeaveTypeDropdownOpen ? "rotate-180" : ""}`} />
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

                <div className="flex justify-end items-center gap-3 pt-4 border-t border-line-subtle">
                  <button
                    type="button"
                    onClick={() => setIsLeaveModalOpen(false)}
                    className="px-4.5 py-2.5 text-xs font-bold text-content-secondary bg-surface-main hover:bg-brand-subtle hover:text-brand-accent rounded-xl border border-line-subtle transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-2.5 text-xs font-bold text-white bg-brand-accent hover:bg-brand-hover rounded-xl shadow-xs hover:shadow-md transition duration-150 cursor-pointer"
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