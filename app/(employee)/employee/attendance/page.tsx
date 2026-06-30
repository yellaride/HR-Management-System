"use client";

import React, { useState } from "react";
import { 
  LogIn, 
  LogOut, 
  CheckCircle, 
  AlertTriangle, 
  Hourglass, 
  Calendar, 
  Clock, 
  Briefcase,
  Play,
  Square,
  Coffee,
  CheckCircle2,
  XCircle
} from "lucide-react";

interface AttendanceLog {
  id: number;
  date: string;
  checkIn: string;
  checkOut: string;
  workingHours: string;
  dayType: "Regular" | "Half Day" | "Weekend" | "Holiday";
  status: "On Time" | "Late" | "Absent" | "In Progress" | "Off";
}

const initialLogs: AttendanceLog[] = [
  { 
    id: 1, 
    date: "June 16, 2026", 
    checkIn: "08:58 AM", 
    checkOut: "05:42 PM", 
    workingHours: "8h 44m", 
    dayType: "Regular", 
    status: "On Time" 
  },
  { 
    id: 2, 
    date: "June 15, 2026", 
    checkIn: "09:42 AM", 
    checkOut: "06:12 PM", 
    workingHours: "8h 30m", 
    dayType: "Regular", 
    status: "Late" 
  },
  { 
    id: 3, 
    date: "June 14, 2026", 
    checkIn: "—", 
    checkOut: "—", 
    workingHours: "—", 
    dayType: "Weekend", 
    status: "Off" 
  },
  { 
    id: 4, 
    date: "June 13, 2026", 
    checkIn: "—", 
    checkOut: "—", 
    workingHours: "—", 
    dayType: "Weekend", 
    status: "Off" 
  },
  { 
    id: 5, 
    date: "June 12, 2026", 
    checkIn: "09:05 AM", 
    checkOut: "05:30 PM", 
    workingHours: "8h 25m", 
    dayType: "Regular", 
    status: "On Time" 
  },
];

export default function EmployeeAttendancePage() {
  const [logs, setLogs] = useState<AttendanceLog[]>(initialLogs);
  const [presentDays, setPresentDays] = useState(18);
  const [lateArrivals, setLateArrivals] = useState(2);
  const [avgHours, setAvgHours] = useState(8.3);

  // Clock-In/Out States
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [hasCheckedOut, setHasCheckedOut] = useState(false);
  const [liveCheckIn, setLiveCheckIn] = useState("—");
  const [liveCheckOut, setLiveCheckOut] = useState("—");

  // Clock-In Action
  const handleCheckIn = () => {
    if (hasCheckedIn) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLiveCheckIn(timeString);
    setHasCheckedIn(true);

    // Create a temporary "In Progress" log entry at the top of the table
    const progressLog: AttendanceLog = {
      id: Date.now(),
      date: "June 17, 2026",
      checkIn: timeString,
      checkOut: "—",
      workingHours: "—",
      dayType: "Regular",
      status: "In Progress"
    };

    setLogs([progressLog, ...logs]);
  };

  // Clock-Out Action
  const handleCheckOut = () => {
    if (!hasCheckedIn || hasCheckedOut) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLiveCheckOut(timeString);
    setHasCheckedOut(true);

    // Update statistics metrics
    setPresentDays(prev => prev + 1);
    setAvgHours(8.4); // Increment avg metrics

    // Replace the "In Progress" row with a completed row
    setLogs(prevLogs => 
      prevLogs.map((log) => {
        if (log.date === "June 17, 2026" && log.status === "In Progress") {
          return {
            ...log,
            checkOut: timeString,
            workingHours: "8h 15m", // Mock calculated hours based on standard schedule
            status: "On Time"
          };
        }
        return log;
      })
    );
  };

  // Status Styling Evaluator matching custom color palettes
  const getStatusStyles = (status: AttendanceLog["status"]) => {
    switch (status) {
      case "On Time":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Late":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "In Progress":
        return "bg-brand-subtle text-brand-accent border-brand-subtle animate-pulse";
      case "Absent":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-slate-100 text-slate-500 border-slate-200";
    }
  };

  // Day Type Styling Evaluator
  const getDayTypeStyles = (type: AttendanceLog["dayType"]) => {
    switch (type) {
      case "Regular":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "Half Day":
        return "bg-purple-50 text-purple-700 border-purple-100";
      case "Holiday":
        return "bg-teal-50 text-teal-700 border-teal-100";
      default:
        return "bg-slate-50 text-slate-500 border-slate-200";
    }
  };

  return (
    <div className="   pb-12 bg-surface-main min-h-screen">
      
      {/* 1. Page Header */}
      <div className="pb-6 border-b border-line-subtle flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-content-main tracking-tight">Attendance</h1>
          <p className="mt-1 text-xs text-content-secondary">
            Log working hours, check-in daily, and review historical shifts.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface-card border border-line-subtle rounded-xl text-xs font-semibold text-content-secondary shadow-xs">
          <Calendar className="w-4 h-4 text-brand-accent" />
          <span>June 17, 2026</span>
        </div>
      </div>

      {/* 2. Primary Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Present Days Card */}
        <div className="p-5 rounded-2xl border border-line-subtle bg-surface-card shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-content-muted">
              Monthly Attendance
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-content-main block">
              {presentDays} <span className="text-sm font-semibold text-content-secondary">Present</span>
            </span>
            <span className="text-[10px] text-content-muted font-medium block mt-1">
              Active working days recorded this period.
            </span>
          </div>
        </div>

        {/* Late Arrival Card */}
        <div className="p-5 rounded-2xl border border-line-subtle bg-surface-card shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-content-muted">
              Late Arrivals
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-content-main block">
              {lateArrivals} <span className="text-sm font-semibold text-content-secondary">Times</span>
            </span>
            <span className="text-[10px] text-content-muted font-medium block mt-1">
              Check-ins logged past the regular grace period.
            </span>
          </div>
        </div>

        {/* Avg Worked Hours Card */}
        <div className="p-5 rounded-2xl border border-line-subtle bg-surface-card shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-content-muted">
              Average Hours
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Hourglass className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-content-main block">
              {avgHours} <span className="text-sm font-semibold text-content-secondary">hrs / day</span>
            </span>
            <span className="text-[10px] text-content-muted font-medium block mt-1">
              Average completed working duration daily.
            </span>
          </div>
        </div>

      </div>

      {/* 3. Daily Attendance Clock-In/Out Large Action Console */}
      <div className="p-6 rounded-2xl border border-line-subtle bg-surface-card shadow-sm space-y-6">
        <div>
          <h2 className="text-sm font-extrabold text-content-main">Real-time Check-In Console</h2>
          <p className="text-[11px] text-content-secondary mt-1">Check-in when beginning your shift and clock-out when finishing.</p>
        </div>

        {/* Large Buttons side-by-side split */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Check In Block Action */}
          <div className="p-5 bg-surface-main border border-line-subtle rounded-xl flex flex-col justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-surface-card border border-line-subtle rounded-xl text-content-secondary">
                <Play className="w-4 h-4 text-emerald-500 fill-emerald-500/25" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-content-main block">Clock In</span>
                <span className="text-[10px] text-content-muted mt-0.5 block">Record shift start: {liveCheckIn}</span>
              </div>
            </div>

            {/* Uses exact CSS utility button classes from your theme */}
            <button
              onClick={handleCheckIn}
              disabled={hasCheckedIn}
              className={hasCheckedIn ? "btn-brand-subtle cursor-not-allowed" : "btn-brand-filled"}
            >
              <LogIn className="w-4 h-4 mr-2" />
              <span>{hasCheckedIn ? "Clocked In" : "Register Check-In"}</span>
            </button>
          </div>

          {/* Check Out Block Action */}
          <div className="p-5 bg-surface-main border border-line-subtle rounded-xl flex flex-col justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-surface-card border border-line-subtle rounded-xl text-content-secondary">
                <Square className="w-4 h-4 text-rose-500 fill-rose-500/25" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-content-main block">Clock Out</span>
                <span className="text-[10px] text-content-muted mt-0.5 block">Record shift end: {liveCheckOut}</span>
              </div>
            </div>

            {/* Disabled logic unless active check-in is verified */}
            <button
              onClick={handleCheckOut}
              disabled={!hasCheckedIn || hasCheckedOut}
              className={
                !hasCheckedIn || hasCheckedOut 
                  ? "btn-outline bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed pointer-events-none hover:translate-y-0" 
                  : "btn-brand-filled bg-rose-600 hover:bg-rose-500 focus:ring-rose-500 shadow-rose-600/10"
              }
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span>{hasCheckedOut ? "Clocked Out" : "Register Check-Out"}</span>
            </button>
          </div>

        </div>
      </div>

      {/* 4. Attendance History Log Table */}
      <div className="space-y-3">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-content-muted">
          Recent Shift History
        </div>

        <div className="bg-surface-card border border-line-subtle rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-main border-b border-line-subtle text-content-muted text-[10px] font-extrabold uppercase tracking-widest">
                  <th className="px-6 py-4">Work Date</th>
                  <th className="px-6 py-4">Day Type</th>
                  <th className="px-6 py-4">Check-In Time</th>
                  <th className="px-6 py-4">Check-Out Time</th>
                  <th className="px-6 py-4">Working Hours</th>
                  <th className="px-6 py-4 text-center">Duty Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-subtle text-content-secondary text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-main/30 transition">
                    
                    {/* Date Column */}
                    <td className="px-6 py-4 font-bold text-content-main flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-content-muted" />
                      <span>{log.date}</span>
                    </td>

                    {/* Day Type Badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wide ${getDayTypeStyles(log.dayType)}`}>
                        {log.dayType === "Regular" && <Briefcase className="w-3 h-3" />}
                        {log.dayType === "Weekend" && <Coffee className="w-3 h-3" />}
                        {log.dayType}
                      </span>
                    </td>

                    {/* Clock In */}
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {log.checkIn}
                    </td>

                    {/* Clock Out */}
                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {log.checkOut}
                    </td>

                    {/* Completed Hours */}
                    <td className="px-6 py-4 font-extrabold text-content-main">
                      {log.workingHours !== "—" ? (
                        <span className="text-brand-accent">{log.workingHours}</span>
                      ) : (
                        <span className="text-content-muted">{log.workingHours}</span>
                      )}
                    </td>

                    {/* Duty Status Badge */}
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${getStatusStyles(log.status)}`}>
                          {log.status === "On Time" && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                          {log.status === "Late" && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                          {log.status === "Absent" && <XCircle className="w-3 h-3 text-rose-500" />}
                          {log.status === "In Progress" && <Clock className="w-3 h-3 text-brand-accent animate-spin" />}
                          {log.status}
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

    </div>
  );
}