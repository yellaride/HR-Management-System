"use client";

import React, { useState } from "react";

import {
  Users,
  Layers,
  CalendarCheck,
  Clock,
  UserPlus,
  FileSpreadsheet,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { StatCard } from "@/app/components/admin/StatCard";
import AddEmployeeModal from "@/app/components/admin/AddEmployeeModal";

export default function AdminDashboardPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addEmployeeError, setAddEmployeeError] = useState<string | null>(null);

  const handleCreateEmployee = async (data: {
    name: string;
    email: string;
    password: string;
    department: string;
    status: string;
    designation: string;
    role: "employee" | "admin";
    salary: number;
    joinDate: string;
  }) => {
    setAddEmployeeError(null);

    try {
      const res = await fetch("/api/admin/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      let serverErrorMsg = "Failed to create profile.";
      if (!res.ok) {
        try {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const result = await res.json();
            serverErrorMsg = result.error || result.message || serverErrorMsg;
          } else {
            const text = await res.text();
            serverErrorMsg = text || serverErrorMsg;
          }
        } catch (_) {}

        throw new Error(serverErrorMsg);
      }

      const result = await res.json();
      if (result?.employee) {
        setIsAddModalOpen(false);
      }
    } catch (err: any) {
      setAddEmployeeError(err?.message || "An error occurred during registration.");
    }
  };

  const [dashboardStats, setDashboardStats] = useState<{
    totalEmployees: number;
    totalDepartments: number;
  } | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  React.useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);

        const res = await fetch("/api/admin/dashboard/stats", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load dashboard stats");
        const data = await res.json();

        setDashboardStats({
          totalEmployees: Number(data.totalEmployees) || 0,
          totalDepartments: Number(data.totalDepartments) || 0,
        });
      } catch (e: any) {
        setStatsError(e?.message || "Failed to load dashboard stats");
        setDashboardStats({ totalEmployees: 0, totalDepartments: 0 });
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, []);

  // Statistics (live for employee/department, mocked for others)
  const stats = [
    {
      label: "Total Employees",
      value: statsLoading ? "—" : String(dashboardStats?.totalEmployees ?? 0),
      change: "+8.4%",
      isPositive: true,
      changeText: "vs last month",
      icon: Users,
      colorClass: "bg-indigo-50/80 text-indigo-600 border-indigo-100/80",
    },
    {
      label: "Total Departments",
      value: statsLoading ? "—" : String(dashboardStats?.totalDepartments ?? 0),
      change: "Active",
      isPositive: true,
      changeText: "2 cross-functional",
      icon: Layers,
      colorClass: "bg-sky-50/80 text-sky-600 border-sky-100/80",
    },
    {
      label: "Today's Attendance",
      value: "94.6%",
      change: "+1.2%",
      isPositive: true,
      changeText: "134 present today",
      icon: CalendarCheck,
      colorClass: "bg-emerald-50/80 text-emerald-600 border-emerald-100/80",
    },
    {
      label: "Pending Leaves",
      value: "12",
      change: "4 Urgent",
      isPositive: false,
      changeText: "Requires review",
      icon: Clock,
      colorClass: "bg-amber-50/80 text-amber-600 border-amber-100/80",
    },
  ];


  // Mock Recent Activities with Initials and Specific Colors
  const recentActivities = [
    {
      id: 1,
      user: "Liam Parker",
      action: "checked in for the day",
      time: "10 mins ago",
      type: "attendance",
      initials: "LP",
      avatarBg: "bg-emerald-100 text-emerald-800",
    },
    {
      id: 2,
      user: "Sophia Martinez",
      action: "submitted a sick leave request",
      time: "1 hour ago",
      type: "leave",
      initials: "SM",
      avatarBg: "bg-amber-100 text-amber-800",
    },
    {
      id: 3,
      user: "Alexander Wright",
      action: "uploaded signed payslip contract",
      time: "3 hours ago",
      type: "payslip",
      initials: "AW",
      avatarBg: "bg-indigo-100 text-indigo-800",
    },
    {
      id: 4,
      user: "Emma Watson",
      action: "updated profile coordinates",
      time: "5 hours ago",
      type: "profile",
      initials: "EW",
      avatarBg: "bg-slate-100 text-slate-800",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* 1. Dashboard Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                HR Operations Portal
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-950 tracking-tight mt-1">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Overview and quick actions for real-time employee directory operations.
            </p>
          </div>

          {/* Header Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 shadow-sm">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>June 17, 2026</span>
            </div>
          </div>
        </div>

        {/* 2. Counter Cards Grid (4 columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <StatCard
              key={idx}
              label={stat.label}
              value={stat.value}
              change={stat.change}
              isPositive={stat.isPositive}
              changeText={stat.changeText}
              icon={stat.icon}
              colorClass={stat.colorClass}
            />
          ))}
        </div>

        {/* 3. Secondary Row: Recent Activities & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sub-grid: Recent Activities (Col-span-2) */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Recent System Activity</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time log of administrative events.</p>
                </div>
                <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition">
                  View All Activity
                </button>
              </div>

              <div className="divide-y divide-slate-100 mt-2">
                {recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar Initials Badge */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 select-none ${
                          act.avatarBg
                        }`}
                      >
                        {act.initials}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                        <span className="font-semibold text-slate-900">{act.user}</span>
                        <span className="text-slate-500 text-xs sm:text-sm">{act.action}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:pl-0 pl-11">
                      {/* Activity Indicator Dot */}
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          act.type === "attendance"
                            ? "bg-emerald-500"
                            : act.type === "leave"
                              ? "bg-amber-500"
                              : act.type === "payslip"
                                ? "bg-indigo-500"
                                : "bg-slate-400"
                        }`}
                      />
                      <span className="text-xs text-slate-400 font-medium">{act.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sub-grid: Quick HR Actions Panel */}
          <div className="lg:col-span-1 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Quick Actions</h2>
                <p className="text-xs text-slate-500 mt-0.5">Direct shortcuts to common HR tasks.</p>
              </div>

              <div className="space-y-3">
                {/* Action 1: Add New Employee - open modal */}
                <button
                  type="button"
                  onClick={() => {
                    setAddEmployeeError(null);
                    setIsAddModalOpen(true);
                  }}
                  aria-label="Add New Employee"
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 hover:border-slate-300 transition text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 group-hover:bg-indigo-100 transition-colors">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-slate-800 block">Add New Employee</span>
                      <span className="text-[11px] text-slate-500">Register new directory profiles</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition" />
                </button>

                {/* Action 2: Process Leave Approvals - Redirects */}
                <a
                  href="/admin/leaves"
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 hover:border-slate-300 transition text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 group-hover:bg-amber-100 transition-colors">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-slate-800 block">Manage Leave Requests</span>
                      <span className="text-[11px] text-slate-500">Approve or deny applications</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition" />
                </a>

                {/* Action 3: Review Payslips - Redirects */}
                <a
                  href="/admin/payslips"
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200 hover:border-slate-300 transition text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-slate-800 block">Review Salary Payslips</span>
                      <span className="text-[11px] text-slate-500">Dispatch salary and tax records</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition" />
                </a>
              </div>

              <div className="pt-4 border-t border-slate-100 text-center">
                <span className="text-xs text-slate-400">
                  Need help? Read the <a href="#" className="text-indigo-600 hover:underline">HR Playbook</a>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Add Employee Modal */}
        <AddEmployeeModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setAddEmployeeError(null);
          }}
          errorMessage={addEmployeeError}
          onSave={handleCreateEmployee}
        />
      </div>
    </div>
  );
}

