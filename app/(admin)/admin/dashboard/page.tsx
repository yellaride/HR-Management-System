"use client";

import React from "react";
import { 
  Users, 
  Layers, 
  CalendarCheck, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  UserPlus, 
  FileSpreadsheet, 
  Calendar,
  ChevronRight
} from "lucide-react";

export default function AdminDashboardPage() {
  
  // Quick Mock Statistics
  const stats = [
    {
      label: "Total Employees",
      value: "142",
      change: "+8.4%",
      isPositive: true,
      changeText: "vs last month",
      icon: Users,
      colorClass: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
    {
      label: "Total Departments",
      value: "8",
      change: "Active",
      isPositive: true,
      changeText: "2 cross-functional",
      icon: Layers,
      colorClass: "bg-sky-50 text-sky-600 border-sky-100",
    },
    {
      label: "Today's Attendance",
      value: "94.6%",
      change: "+1.2%",
      isPositive: true,
      changeText: "134 present today",
      icon: CalendarCheck,
      colorClass: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      label: "Pending Leaves",
      value: "12",
      change: "4 Urgent",
      isPositive: false,
      changeText: "Requires review",
      icon: Clock,
      colorClass: "bg-amber-50 text-amber-600 border-amber-100",
    },
  ];

  // Mock Recent Activities
  const recentActivities = [
    { id: 1, user: "Liam Parker", action: "checked in", time: "10 mins ago", type: "attendance" },
    { id: 2, user: "Sophia Martinez", action: "submitted sick leave request", time: "1 hour ago", type: "leave" },
    { id: 3, user: "Alexander Wright", action: "uploaded signed payslip contract", time: "3 hours ago", type: "payslip" },
    { id: 4, user: "Emma Watson", action: "updated profile coordinates", time: "5 hours ago", type: "profile" },
  ];

  return (
    <div className=" max-w-[1400px] mx-auto pb-12">
      
      {/* 1. Dashboard Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="mt-1 text-xs text-slate-500">
            Overview and quick actions for real-time HR directory operations.
          </p>
        </div>
        
        {/* Date Display Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-sm">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>June 17, 2026</span>
        </div>
      </div>

      {/* 2. Counter Cards Grid (4 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const IconComponent = stat.icon;
          return (
            <div 
              key={idx}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between">
                {/* Statistics Icon Wrapper */}
                <div className={`p-3 rounded-xl border flex items-center justify-center ${stat.colorClass}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                
                {/* Metric Delta Badge */}
                <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                  stat.isPositive 
                    ? "bg-emerald-50 text-emerald-700" 
                    : "bg-amber-50 text-amber-700"
                }`}>
                  {stat.isPositive ? (
                    <ArrowUpRight className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-amber-600 stroke-[2.5]" />
                  )}
                  {stat.change}
                </span>
              </div>

              {/* Metric Values */}
              <div>
                <span className="text-2xl font-black text-slate-900 tracking-tight block">
                  {stat.value}
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mt-1">
                  {stat.label}
                </span>
              </div>

              {/* Status Context Helper Text */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>{stat.changeText}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Secondary Row: Recent Activities & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Sub-grid: Recent Activities (Col-span-2) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Recent System Activity</h2>
              <button className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700">
                View All
              </button>
            </div>
            
            <div className="divide-y divide-slate-100 mt-4">
              {recentActivities.map((act) => (
                <div key={act.id} className="py-3 flex.col flex sm:flex-row sm:items-center sm:justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2.5">
                    {/* Activity Indicator Dot */}
                    <span className={`w-2 h-2 rounded-full ${
                      act.type === "attendance" ? "bg-emerald-500" :
                      act.type === "leave" ? "bg-amber-500" :
                      act.type === "payslip" ? "bg-indigo-500" : "bg-slate-400"
                    }`} />
                    <span className="text-slate-700">
                      <strong className="font-semibold text-slate-900">{act.user}</strong> {act.action}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium sm:pl-0 pl-4">
                    {act.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sub-grid: Quick HR Actions Panel */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Quick HR Actions</h2>
            <p className="text-[11px] text-slate-500 mt-1">Direct paths for general HR workflows.</p>
          </div>

          <div className="space-y-3">
            {/* Action 1: Add New Employee */}
            <button className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100/70 hover:border-slate-300 transition text-left group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Add Employee</span>
                  <span className="text-[10px] text-slate-500">Register new directory profiles</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition" />
            </button>

            {/* Action 2: Process Leave Approvals */}
            <button className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100/70 hover:border-slate-300 transition text-left group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Leave Requests</span>
                  <span className="text-[10px] text-slate-500">Approve or deny applications</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition" />
            </button>

            {/* Action 3: Review Payslips */}
            <button className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100/70 hover:border-slate-300 transition text-left group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-800 block">Manage Payslips</span>
                  <span className="text-[10px] text-slate-500">Dispatch salary summaries</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}