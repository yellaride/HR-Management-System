"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  LogIn, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  History,
  Timer,
  AlertCircle
} from "lucide-react";

interface AttendanceRecord {
  _id: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  workingHours?: number;
  formattedDuration?: string;
  status: "On Time" | "Late" | "Absent";
}

interface ActiveSettings {
  shiftStart: string;
  shiftEnd: string;
  gracePeriod: number;
  checkInDisplayBefore: number;
  checkOutDisplayAfter: number;
  autoCheckOut: boolean;
  autoCheckOutTime: string;
}

function ClockWidget() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    const initial = setTimeout(() => setCurrentTime(new Date()), 0);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, []);

  if (!currentTime) {
    return <span className="text-sm font-bold text-content-main tabular-nums">--:--:--</span>;
  }

  return (
    <span className="text-sm font-bold text-content-main tabular-nums">
      {currentTime.toLocaleTimeString([], { 
        hour: "2-digit", 
        minute: "2-digit", 
        second: "2-digit", 
        hour12: true 
      })}
    </span>
  );
}

export default function EmployeeAttendancePage() {
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [settings, setSettings] = useState<ActiveSettings>({
    shiftStart: "09:00",
    shiftEnd: "17:00",
    gracePeriod: 15,
    checkInDisplayBefore: 30,
    checkOutDisplayAfter: 0,
    autoCheckOut: false,
    autoCheckOutTime: "18:00"
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: "check-in" | "check-out" | null;
  }>({ isOpen: false, action: null });

  const [isSunday, setIsSunday] = useState<boolean>(false);
  const [isWithinWindow, setIsWithinWindow] = useState<boolean>(false);
  const [isPastAutoCheckOut, setIsPastAutoCheckOut] = useState<boolean>(false);

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

    const [startH, startM] = settings.shiftStart.split(":").map(Number);
    const [endH, endM] = settings.shiftEnd.split(":").map(Number);

    const shiftStartMin = startH * 60 + startM;
    const shiftEndMin = endH * 60 + endM;

    const checkInOffset = settings.checkInDisplayBefore || 30;
    const checkOutOffset = settings.checkOutDisplayAfter || 0;

    const startLimit = shiftStartMin - checkInOffset; 
    const endLimit = shiftEndMin + checkOutOffset; 

    setIsWithinWindow(currentMins >= startLimit && currentMins <= endLimit);

    if (settings.autoCheckOut) {
      const [autoH, autoM] = settings.autoCheckOutTime.split(":").map(Number);
      const autoMins = autoH * 60 + autoM;
      setIsPastAutoCheckOut(currentMins >= autoMins);
    } else {
      setIsPastAutoCheckOut(false);
    }
  }, [settings]);

  const fetchAttendanceData = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = !!opts?.silent;
    try {
      const res = await fetch("/api/employee/attendance");
      const data = await res.json();
      if (res.ok) {
        setTodayRecord(data.todayRecord || null);
        setHistory(data.history || []);
        if (data.settings) {
          setSettings(data.settings);
        }
      } else {
        setErrorMessage(data.error || "Failed to fetch attendance history.");
      }
    } catch {
      setErrorMessage("An unexpected network error occurred.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = setTimeout(() => fetchAttendanceData(), 0);
    return () => clearTimeout(initialLoad);
  }, [fetchAttendanceData]);

  useEffect(() => {
    const initial = setTimeout(evaluateTimeConstraints, 0);
    const interval = setInterval(evaluateTimeConstraints, 15000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [settings, evaluateTimeConstraints]);

  const totalAccumulatedHours = useMemo(() => {
    const total = history.reduce((sum, record) => sum + (record.workingHours || 0), 0);
    return Math.round(total * 100) / 100;
  }, [history]);

  const handleAction = async (actionType: "check-in" | "check-out") => {
    try {
      setActionLoading(true);
      setErrorMessage(null);

      const res = await fetch("/api/employee/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Action execution failed.");
      } else {
        await fetchAttendanceData({ silent: true }); 
      }
    } catch {
      setErrorMessage("Network error processing your request.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeStyle = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "On Time":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Late":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Absent":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-surface-main text-content-secondary border-line-subtle";
    }
  };

  const formatTimeStr = (isoString?: string) => {
    if (!isoString) return "--:--";
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const getReadableTime = (timeStr: string, minutesOffset: number) => {
    const [h, m] = timeStr.split(":").map(Number);
    let total = h * 60 + m + minutesOffset;
    if (total < 0) total += 24 * 60;
    total = total % (24 * 60);
    const finalH = Math.floor(total / 60);
    const finalM = total % 60;
    const finalHPadded = String(finalH).padStart(2, "0");
    const finalMPadded = String(finalM).padStart(2, "0");

    const hourNum = parseInt(finalHPadded, 10);
    const ampm = hourNum >= 12 ? "PM" : "AM";
    const formattedHour = hourNum % 12 || 12;
    return `${formattedHour}:${finalMPadded} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-xs text-content-secondary">
        Syncing attendance log data...
      </div>
    );
  }

  const isButtonsDisabled = isSunday || !isWithinWindow || isPastAutoCheckOut || actionLoading;

  return (
    <div className="space-y-6 pb-12">
      {/* Confirmation Dialog */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-content-main/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-surface-card border border-line-subtle rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5 text-amber-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-content-main">Confirm Action</h3>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              Are you sure you want to register your <span className="font-bold text-content-main">{confirmModal.action === "check-in" ? "Check-In" : "Check-Out"}</span> session? Please verify before continuing.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModal({ isOpen: false, action: null })}
                className="px-4 py-2 border border-line-subtle rounded-xl text-xs font-semibold text-content-secondary hover:bg-surface-main transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmModal.action) {
                    handleAction(confirmModal.action);
                  }
                  setConfirmModal({ isOpen: false, action: null });
                }}
                className={`px-4 py-2 text-white rounded-xl text-xs font-semibold transition cursor-pointer ${
                  confirmModal.action === "check-in" 
                    ? "bg-brand-accent hover:bg-brand-hover" 
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="pb-6 border-b border-line-subtle flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-content-main tracking-tight">
            Shift Attendance
          </h1>
          <p className="mt-1 text-xs text-content-secondary leading-relaxed">
            Process daily session check-in and check-out logs and track active session stats.
          </p>
        </div>

        {/* Real-time Clock Widget */}
        <div className="flex items-center gap-3 bg-surface-card border border-line-subtle py-2 px-4 rounded-xl shadow-xs shrink-0 self-start sm:self-auto">
          <Clock className="w-4 h-4 text-brand-accent animate-pulse" />
          <ClockWidget />
        </div>
      </div>

      {/* Dynamic Alerts */}
      {isSunday && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Today is Sunday (Weekly Off). Shift actions are currently disabled.</span>
        </div>
      )}

      {!isSunday && !isWithinWindow && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Outside Shift Margin: Attendance actions are restricted between {getReadableTime(settings.shiftStart, -(settings.checkInDisplayBefore || 0))} and {getReadableTime(settings.shiftEnd, (settings.checkOutDisplayAfter || 0))}.</span>
        </div>
      )}

      {!isSunday && isWithinWindow && isPastAutoCheckOut && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Shift Auto Checked-Out: System automatic threshold has run. Manual check-outs are disabled for this session.</span>
        </div>
      )}

      {/* Rule Alerts Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-brand-subtle/50 border border-brand-subtle text-xs text-content-main leading-relaxed">
        <div className="flex gap-2">
          <AlertCircle className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block text-content-main">Check-In Grace Period:</strong>
            Shift starts active check-ins at {getReadableTime(settings.shiftStart, -(settings.checkInDisplayBefore || 0))}. Arrivals after {getReadableTime(settings.shiftStart, (settings.gracePeriod || 15))} will flag your session status as <span className="text-amber-700 font-bold">Late</span>.
          </div>
        </div>
        <div className="flex gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block text-content-main">Operational Limits:</strong>
            Working hours count only between {settings.shiftStart} and {settings.shiftEnd}. Hours worked outside this interval will not accumulate, and are capped at 8 hours maximum.
          </div>
        </div>
      </div>

      {/* Error Output Banner */}
      {errorMessage && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Check-In Card */}
        <div className="p-5 sm:p-6 rounded-2xl border border-line-subtle bg-surface-card shadow-xs flex flex-col justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-content-muted">Daily Entrance Check-In</span>
            <h2 className="text-base sm:text-lg font-extrabold text-content-main">Start Work Session</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-brand-subtle text-brand-accent">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-content-muted block font-medium">Recorded Check-In</span>
              <span className="text-sm font-bold text-content-main">
                {todayRecord ? formatTimeStr(todayRecord.checkIn) : "Not Tracked"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmModal({ isOpen: true, action: "check-in" })}
            disabled={!!todayRecord || isButtonsDisabled}
            className="w-full bg-brand-accent hover:bg-brand-hover text-white py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed inline-flex justify-center items-center gap-2 transition cursor-pointer shadow-xs"
          >
            {actionLoading ? "Executing..." : todayRecord ? "Checked In Successfully" : "Register Check-In"}
          </button>
        </div>

        {/* Check-Out Card */}
        <div className="p-5 sm:p-6 rounded-2xl border border-line-subtle bg-surface-card shadow-xs flex flex-col justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-content-muted">Daily Departure Check-Out</span>
            <h2 className="text-base sm:text-lg font-extrabold text-content-main">End Work Session</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-content-muted block font-medium">Recorded Check-Out</span>
              <span className="text-sm font-bold text-content-main">
                {todayRecord?.checkOut ? formatTimeStr(todayRecord.checkOut) : "Not Tracked"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setConfirmModal({ isOpen: true, action: "check-out" })}
            disabled={!todayRecord || !!todayRecord?.checkOut || isButtonsDisabled}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed inline-flex justify-center items-center gap-2 transition cursor-pointer shadow-xs"
          >
            {actionLoading ? "Executing..." : todayRecord?.checkOut ? "Checked Out Successfully" : "Register Check-Out"}
          </button>
        </div>

        {/* Status Metrics Card */}
        <div className="p-5 sm:p-6 rounded-2xl border border-line-subtle bg-surface-card shadow-xs flex flex-col justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-content-muted">Session Diagnostics</span>
            <h2 className="text-base sm:text-lg font-extrabold text-content-main">Status & Active Hours</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-line-subtle pb-2.5">
              <span className="text-xs text-content-secondary font-medium flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-content-muted" /> Today&apos;s Session
              </span>
              <span className="text-xs font-bold text-content-main">
                {todayRecord?.formattedDuration || "0 hrs 0 mins"}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-line-subtle pb-2.5">
              <span className="text-xs text-content-secondary font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-content-muted" /> Monthly Total
              </span>
              <span className="text-xs font-bold text-brand-accent">
                {totalAccumulatedHours} hrs
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-content-secondary font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-content-muted" /> Attendance State
              </span>
              {todayRecord ? (
                <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${getStatusBadgeStyle(todayRecord.status)}`}>
                  {todayRecord.status}
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-content-muted uppercase">Unregistered</span>
              )}
            </div>
          </div>
          <div className="text-[10px] leading-normal text-content-muted text-center pt-2">
            Status calculations adapt instantly based on when daily checkpoints are saved.
          </div>
        </div>

      </div>

      {/* Recent History Table */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-content-muted">
          <History className="w-3.5 h-3.5" /> Recent Attendance History
        </div>

        <div className="bg-surface-card border border-line-subtle rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-surface-main/60 border-b border-line-subtle text-content-muted text-[10px] font-extrabold uppercase tracking-widest">
                  <th className="px-6 py-4">Logged Date</th>
                  <th className="px-6 py-4">Check-In Event</th>
                  <th className="px-6 py-4">Check-Out Event</th>
                  <th className="px-6 py-4">Working Hours</th>
                  <th className="px-6 py-4 text-center">Calculated State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle text-content-secondary text-xs">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-content-muted">
                      No historical logs recorded. Register a check-in action to create one.
                    </td>
                  </tr>
                ) : (
                  history.map((record) => (
                    <tr key={record._id} className="hover:bg-surface-main/50 transition">
                      <td className="px-6 py-4 font-bold text-content-main">
                        {record.date}
                      </td>
                      <td className="px-6 py-4 font-medium text-content-secondary">
                        {formatTimeStr(record.checkIn)}
                      </td>
                      <td className="px-6 py-4 font-medium text-content-secondary">
                        {record.checkOut ? formatTimeStr(record.checkOut) : "Ongoing"}
                      </td>
                      <td className="px-6 py-4 font-bold text-content-main">
                        {record.formattedDuration || "--"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wide ${getStatusBadgeStyle(record.status)}`}>
                            {record.status}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}