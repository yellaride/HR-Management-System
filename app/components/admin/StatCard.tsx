"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  change: string;
  isPositive: boolean;
  changeText: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}

export function StatCard({
  label,
  value,
  change,
  isPositive,
  changeText,
  icon: IconComponent,
  colorClass,
}: StatCardProps) {
  return (
    <div className="group p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-5">
      <div className="flex items-start justify-between">
        {/* Statistics Icon Wrapper */}
        <div className={`p-3 rounded-xl border flex items-center justify-center transition-colors ${colorClass}`}>
          <IconComponent className="w-5 h-5" />
        </div>
        
        {/* Metric Delta Badge */}
        <span className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide ${
          isPositive 
            ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
            : "bg-amber-50 text-amber-700 border border-amber-100"
        }`}>
          {isPositive ? (
            <ArrowUpRight className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
          ) : (
            <ArrowDownRight className="w-3 h-3 text-amber-600 stroke-[2.5]" />
          )}
          {change}
        </span>
      </div>

      {/* Metric Values */}
      <div>
        <span className="text-3xl font-bold text-slate-950 tracking-tight block">
          {value}
        </span>
        <span className="text-xs font-medium text-slate-500 block mt-1">
          {label}
        </span>
      </div>

      {/* Status Context Helper Text */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>{changeText}</span>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}