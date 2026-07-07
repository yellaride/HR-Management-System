"use client";

import React, { useState, useEffect, useCallback } from "react";
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

function ClockWidget() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // States to hold the validation rules for the interactive UI buttons
  const [isSunday, setIsSunday] = useState<boolean>(false);
  const [isWithinWindow, setIsWithinWindow] = useState<boolean>(false);

  // Validate operational hour rules dynamically (11:30 AM to 8:30 PM)
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

  const fetchAttendanceData = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = !!opts?.silent;
    try {
      if (!silent) setLoading(true);
      const res = await fetch("/api/employee/attendance");
      const data = await res.json();
      if (res.ok) {
        setTodayRecord(data.todayRecord || null);
        setHistory(data.history || []);
      } else {
        setErrorMessage(data.error || "Failed to fetch attendance history.");
      }
    } catch {
      setErrorMessage("An unexpected network error occurred.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Sync constraints and data on load
  useEffect(() => {
    fetchAttendanceData();
    evaluateTimeConstraints();
    
    const interval = setInterval(evaluateTimeConstraints, 15000); // Check constraints every 15 seconds
    return () => clearInterval(interval);
  }, [fetchAttendanceData, evaluateTimeConstraints]);

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
    } catch (err) {
      setErrorMessage("Network error processing your request.");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeStyle = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "On Time":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Late":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "Absent":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const formatTimeStr = (isoString?: string) => {
    if (!isoString) return "--:--";
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-xs text-content-secondary">
        Syncing attendance log data...
      </div>
    );
  }

  // Determine if check-in or check-out buttons should be disabled based on time boundaries
  const isButtonsDisabled = isSunday || !isWithinWindow || actionLoading;

  return (
    <div className="space-y-6 pt-4 pb-12 bg-surface-main min-h-screen">
      
      {/* 1. Page Header */}
      <div className="pb-6 border-b border-line-subtle flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-content-main tracking-tight">Shift Attendance</h1>
          <p className="mt-1 text-xs text-content-secondary">
            Process daily session check-in and check-out logs and track active session stats.
          </p>
        </div>

        {/* Real-time Clock Widget */}
        <div className="flex items-center gap-3 bg-surface-card border border-line-subtle py-2 px-4 rounded-xl shadow-xs self-start">
          <Clock className="w-4 h-4 text-brand-accent animate-pulse" />
          <ClockWidget />
        </div>
      </div>

      {/* Dynamic Alerts for Sundays or Shift Closures */}
      {isSunday && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>Today is Sunday (Weekly Off). Shift actions are currently disabled.</span>
        </div>
      )}

      {!isSunday && !isWithinWindow && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>Outside Shift Margin: Attendance actions are restricted between 11:30 AM and 08:30 PM.</span>
        </div>
      )}

      {/* 2. Rule Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100/60 text-xs text-indigo-900 leading-relaxed">
        <div className="flex gap-2">
          <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block">Check-In Grace Period:</strong>
            Shift begins at 12:00 PM. Arrivals after 12:30 PM will flag your state as <span className="text-amber-700 font-bold">Late</span>.
          </div>
        </div>
        <div className="flex gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block">Operational Limits:</strong>
            Working hours count only between 11:30 AM and 8:30 PM. Hours worked outside this interval will not accumulate.
          </div>
        </div>
      </div>

      {/* Error Output banner if any */}
      {errorMessage && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3. Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Check-In Action Card */}
        <div className="p-6 rounded-2xl border border-line-subtle bg-surface-card shadow-sm flex flex-col justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-content-muted">Daily Entrance Check-In</span>
            <h2 className="text-lg font-extrabold text-content-main">Start Today's Work Session</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
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
            onClick={() => handleAction("check-in")}
            disabled={!!todayRecord || isButtonsDisabled}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed inline-flex justify-center items-center gap-2 transition"
          >
            {actionLoading ? "Executing..." : todayRecord ? "Checked In Successfully" : "Register Check-In"}
          </button>
        </div>

        {/* Check-Out Action Card */}
        <div className="p-6 rounded-2xl border border-line-subtle bg-surface-card shadow-sm flex flex-col justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-content-muted">Daily Departure Check-Out</span>
            <h2 className="text-lg font-extrabold text-content-main">End Today's Work Session</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
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
            onClick={() => handleAction("check-out")}
            disabled={!todayRecord || !!todayRecord?.checkOut || isButtonsDisabled}
            className="w-full bg-rose-600 text-white hover:bg-rose-700 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed inline-flex justify-center items-center gap-2 transition"
          >
            {actionLoading ? "Executing..." : todayRecord?.checkOut ? "Checked Out Successfully" : "Register Check-Out"}
          </button>
        </div>

        {/* Status Metrics Overview */}
        <div className="p-6 rounded-2xl border border-line-subtle bg-surface-card shadow-sm flex flex-col justify-between gap-6">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-content-muted">Session Diagnostics</span>
            <h2 className="text-lg font-extrabold text-content-main">Status & Active Hours</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-line-subtle pb-2.5">
              <span className="text-xs text-content-secondary font-medium flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-content-muted" /> Working Hours
              </span>
              <span className="text-xs font-bold text-content-main">
                {todayRecord?.formattedDuration || "0 hrs 0 mins"}
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

      {/* 4. Attendance History Logs List */}
      <div className="space-y-3">
        <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-content-muted">
          <History className="w-3.5 h-3.5" /> Recent Attendance History
        </div>

        <div className="bg-surface-card border border-line-subtle rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-main border-b border-line-subtle text-content-muted text-[10px] font-extrabold uppercase tracking-widest">
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
                    <tr key={record._id} className="hover:bg-surface-main/30 transition">
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