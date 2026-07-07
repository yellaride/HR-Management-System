"use client";

import React, { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";

// 1. CountUp Component
// Smoothly animates numbers from 0 to the exact target value using requestAnimationFrame.
interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
}

export function CountUp({ end, duration = 800, suffix = "" }: CountUpProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const startValue = 0;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // Smooth easeOutQuad function
      const easeProgress = percentage * (2 - percentage);
      
      setCount(Math.floor(startValue + easeProgress * (end - startValue)));

      if (progress < duration) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [end, duration]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}

// 2. StatCard Component
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
  // Checks if 'change' represents a numeric percentage trend (e.g. "+8.4%", "-1.2%")
  const hasTrend = /^[+-]?\d+(\.\d+)?%?$/.test(change) || change.includes("%") || change.startsWith("+") || change.startsWith("-");

  // Determine dynamic badge colors based on trend direction or status labels
  let badgeColorClass = "bg-slate-50 text-slate-700 border-slate-100";
  
  if (hasTrend) {
    badgeColorClass = isPositive 
      ? "bg-emerald-50 text-emerald-700 border border-emerald-100/80" 
      : "bg-rose-50 text-rose-700 border border-rose-100/80";
  } else {
    const lowerChange = change.toLowerCase();
    if (lowerChange.includes("action") || lowerChange.includes("pending") || lowerChange.includes("require")) {
      badgeColorClass = "bg-amber-50 text-amber-700 border border-amber-100/80";
    } else if (lowerChange.includes("active") || lowerChange.includes("system")) {
      badgeColorClass = "bg-sky-50 text-sky-700 border border-sky-100/80";
    }
  }

  // Parse strings and percentages dynamically to apply the CountUp animation
  const renderValue = () => {
    if (value === "—") return "—";
    
    const cleanValue = String(value).replace(/[%+,]/g, "");
    const num = Number(cleanValue);
    
    if (!isNaN(num)) {
      const isPercent = String(value).includes("%");
      return <CountUp end={num} suffix={isPercent ? "%" : ""} />;
    }
    
    return value;
  };

  return (
    <div className="group p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between gap-5">
      <div className="flex items-start justify-between">
        {/* Statistics Icon Wrapper */}
        <div className={`p-3 rounded-xl border flex items-center justify-center transition-colors ${colorClass}`}>
          <IconComponent className="w-5 h-5" />
        </div>
        
        {/* Metric Delta Badge - Shows arrow only if it represents a trend direction */}
        <span className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${badgeColorClass}`}>
          {hasTrend && (
            isPositive ? (
              <ArrowUpRight className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
            ) : (
              <ArrowDownRight className="w-3 h-3 text-rose-600 stroke-[2.5]" />
            )
          )}
          {change}
        </span>
      </div>

      {/* Metric Values */}
      <div>
        <span className="text-3xl font-bold text-slate-950 tracking-tight block">
          {renderValue()}
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