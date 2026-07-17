"use client";

import React from "react";
import { Users, CheckCircle, XCircle, Clock, Calendar } from "lucide-react";

interface SummaryProps {
  metrics: {
    totalEmployees: number;
    presentCount: number;
    absentCount: number;
    onTimeCount: number;
    lateCount: number;
  };
  filterDate: string;
}

export default function AttendanceSummaryCards({ metrics, filterDate }: SummaryProps) {
  return (
    <div className="space-y-3">
      {/* Header with static, read-only date card representing Pakistan Time today */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-content-muted)]">
          Attendance Indicators
        </span>
        <div className="flex items-center gap-2 bg-slate-50 border border-[var(--color-line-subtle)] rounded-xl px-3 py-1.5 text-xs font-bold text-[var(--color-content-main)]">
          <Calendar className="w-3.5 h-3.5 text-[var(--color-brand-accent)]" />
          <span>Today: {filterDate}</span>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        
        {/* Total Staff */}
        <div className="bg-white border border-[var(--color-line-subtle)] rounded-2xl p-4 relative overflow-hidden shadow-3xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-content-muted)]">Active Staff</span>
            <Users className="w-4 h-4 text-violet-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-[var(--color-content-main)]">{metrics.totalEmployees}</span>
            <span className="text-[10px] text-[var(--color-content-muted)]">Directory</span>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-1 bg-violet-400" />
        </div>

        {/* Present Today */}
        <div className="bg-white border border-[var(--color-line-subtle)] rounded-2xl p-4 relative overflow-hidden shadow-3xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-content-muted)]">On Duty</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-600">{metrics.presentCount}</span>
            <span className="text-[10px] text-emerald-700 font-bold">
              {metrics.totalEmployees > 0 ? `${Math.round((metrics.presentCount / metrics.totalEmployees) * 100)}%` : "0%"}
            </span>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-1 bg-emerald-400" />
        </div>

        {/* On Time Arrivals */}
        <div className="bg-white border border-[var(--color-line-subtle)] rounded-2xl p-4 relative overflow-hidden shadow-3xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-content-muted)]">On Time</span>
            <CheckCircle className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-indigo-600">{metrics.onTimeCount}</span>
            <span className="text-[10px] text-[var(--color-content-muted)]">Arrivals</span>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-1 bg-indigo-400" />
        </div>

        {/* Late arrivals */}
        <div className="bg-white border border-[var(--color-line-subtle)] rounded-2xl p-4 relative overflow-hidden shadow-3xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-content-muted)]">Late Arrivals</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-600">{metrics.lateCount}</span>
            <span className="text-[10px] text-amber-600 font-bold">Deficit</span>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-1 bg-amber-400" />
        </div>

        {/* Absent Count */}
        <div className="bg-white border border-[var(--color-line-subtle)] rounded-2xl p-4 relative overflow-hidden shadow-3xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-content-muted)]">Absentees</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-rose-600">{metrics.absentCount}</span>
            <span className="text-[10px] text-rose-500">Unpunched</span>
          </div>
          <div className="absolute bottom-0 inset-x-0 h-1 bg-rose-400" />
        </div>

      </div>
    </div>
  );
}