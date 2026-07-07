"use client";

import React, { useState, useEffect } from "react";
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
import Link from "next/link";
import { RecentActivityPanel } from "@/app/components/admin/RecentActivityPanel";

function getFriendlyErrorMessage(error: string | null): string | null {
  if (!error) return null;
  const lower = error.toLowerCase();
  
  if (lower.includes("failed to fetch") || lower.includes("networkerror")) {
    return "Unable to connect to the server. Please check your network connection and try again.";
  }
  if (lower.includes("unauthorized") || lower.includes("forbidden") || lower.includes("401") || lower.includes("403")) {
    return "Your authorization has expired or you do not have permission. Please sign in again.";
  }
  if (lower.includes("not found") || lower.includes("404")) {
    return "The requested information could not be found. Please refresh and try again.";
  }
  if (lower.includes("unique") || lower.includes("already exists") || lower.includes("duplicate")) {
    return "An employee account with this email address is already registered.";
  }
  if (lower.includes("validation") || lower.includes("required") || lower.includes("invalid input")) {
    return "Please verify that all fields are filled out correctly before saving.";
  }
  return "Something went wrong while processing this action. Please try again shortly.";
}

export default function AdminDashboardPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addEmployeeError, setAddEmployeeError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState("");

  // Resolves Next.js server-to-client hydration lag and displays the current live date
  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    setCurrentDate(new Date().toLocaleDateString("en-US", options));
  }, []);

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
    pendingLeaves: number;
    todayAttendancePercent: number;
    presentToday: number;
  } | null>(null);
  
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);

        const res = await fetch("/api/admin/dashboard", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load dashboard stats");
        const data = await res.json();

        setDashboardStats({
          totalEmployees: Number(data.totalEmployees) || 0,
          totalDepartments: Number(data.totalDepartments) || 0,
          pendingLeaves: typeof data.pendingLeaves === "number" ? data.pendingLeaves : 0,
          todayAttendancePercent: typeof data.todayAttendancePercent === "number" ? data.todayAttendancePercent : 0,
          presentToday: typeof data.presentToday === "number" ? data.presentToday : 0,
        });
      } catch (e: any) {
        setStatsError(e?.message || "Failed to load dashboard stats");
        setDashboardStats({
          totalEmployees: 0,
          totalDepartments: 0,
          pendingLeaves: 0,
          todayAttendancePercent: 0,
          presentToday: 0,
        });
      } finally {
        setStatsLoading(false);
      }
    };

    loadStats();
  }, []);

  // System statistics structured with custom variables for visual cohesion
  const stats = [
    {
      label: "Total Employees",
      value: statsLoading ? "—" : String(dashboardStats?.totalEmployees ?? 0),
      change: "+8.4%",
      isPositive: true,
      changeText: "vs last month",
      icon: Users,
      colorClass: "bg-[var(--color-brand-subtle)] text-[var(--color-brand-accent)] border-[var(--color-line-subtle)]",
    },
    {
      label: "Total Departments",
      value: statsLoading ? "—" : String(dashboardStats?.totalDepartments ?? 0),
      change: "Active",
      isPositive: true,
      changeText: "In administration",
      icon: Layers,
      colorClass: "bg-[var(--color-brand-subtle)]/40 text-[var(--color-brand-hover)] border-[var(--color-line-subtle)]/60",
    },
    {
      label: "Today's Attendance",
      value: statsLoading ? "—" : `${dashboardStats?.todayAttendancePercent ?? 0}%`,
      change: "+1.2%",
      isPositive: true,
      changeText: `${dashboardStats?.presentToday ?? 0} present today`,
      icon: CalendarCheck,
      colorClass: "bg-emerald-50/80 text-emerald-700 border-emerald-100/80",
    },
    {
      label: "Pending Leaves",
      value: statsLoading ? "—" : String(dashboardStats?.pendingLeaves ?? 0),
      change: "Action Required",
      isPositive: false,
      changeText: "Requires standard review",
      icon: Clock,
      colorClass: "bg-amber-50/80 text-amber-700 border-amber-100/80",
    },
  ];

  

  return (
    <div className="min-h-screen bg-[var(--color-surface-main)] pb-16">
      <div className="px-2 py-6 space-y-6 w-full">
        
        {/* 1. Dashboard Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[var(--color-line-subtle)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--color-brand-accent)] animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-brand-accent)]">
                HR Operations Portal
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-[var(--color-content-main)] tracking-tight mt-1">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-[var(--color-content-secondary)]">
              Overview and quick actions for real-time employee directory operations.
              {statsError && (
                <span className="block mt-2 text-xs text-amber-600 font-medium">
                  ⚠️ {getFriendlyErrorMessage(statsError)}
                </span>
              )}
            </p>
          </div>

          {/* Header Actions Displaying the Dynamic Current Date */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-[var(--color-surface-card)] border border-[var(--color-line-subtle)] rounded-xl text-xs font-bold text-[var(--color-brand-accent)] shadow-sm">
              <Calendar className="w-4 h-4 text-[var(--color-brand-accent)]" />
              <span>{currentDate || "Loading Date..."}</span>
            </div>
          </div>
        </div>

        {/* 2. Counter Cards Grid */}
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
          {/* Left Sub-grid: Recent Activities (Col-span-2) */}
<div className="lg:col-span-2 panel p-6 flex flex-col justify-between gap-6 min-w-0">
<div className="min-w-0">
    <div className="flex items-center justify-between pb-4 border-b border-[var(--color-line-subtle)]">
      <div>
        <h2 className="text-base font-semibold text-[var(--color-content-main)]">Recent System Activity</h2>
        <p className="text-xs text-[var(--color-content-secondary)] mt-0.5">Real-time log of administrative events.</p>
      </div>
      <Link href="/admin/activity" className="text-xs font-semibold text-[var(--color-brand-accent)] hover:text-[var(--color-brand-hover)] transition cursor-pointer">
        View All Activity
      </Link>
    </div>

    {/* Live database backed Activity Feed */}
    <div className="mt-2">
      <RecentActivityPanel />
    </div>
  </div>
</div>

          {/* Right Sub-grid: Quick HR Actions Panel */}
          <div className="lg:col-span-1 panel p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-[var(--color-content-main)]">Quick Actions</h2>
                <p className="text-xs text-[var(--color-content-secondary)] mt-0.5">Direct shortcuts to common HR tasks.</p>
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
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-surface-main)]/60 hover:bg-[var(--color-surface-main)] border border-[var(--color-line-subtle)] hover:border-[var(--color-brand-subtle)] transition-all duration-200 text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[var(--color-brand-subtle)] text-[var(--color-brand-accent)] rounded-lg border border-[var(--color-brand-subtle)] group-hover:bg-[var(--color-brand-accent)] group-hover:text-white transition-all duration-200">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-[var(--color-content-main)] block">Add New Employee</span>
                      <span className="text-[11px] text-[var(--color-content-secondary)]">Register new directory profiles</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--color-content-muted)] group-hover:text-[var(--color-content-secondary)] group-hover:translate-x-0.5 transition" />
                </button>

                {/* Action 2: Process Leave Approvals */}
                <a
                  href="/admin/leaves"
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-surface-main)]/60 hover:bg-[var(--color-surface-main)] border border-[var(--color-line-subtle)] hover:border-[var(--color-brand-subtle)] transition-all duration-200 text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg border border-amber-100 group-hover:bg-amber-500 group-hover:text-white transition-all duration-200">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-[var(--color-content-main)] block">Manage Leave Requests</span>
                      <span className="text-[11px] text-[var(--color-content-secondary)]">Approve or deny applications</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--color-content-muted)] group-hover:text-[var(--color-content-secondary)] group-hover:translate-x-0.5 transition" />
                </a>

                {/* Action 3: Review Payslips */}
                <a
                  href="/admin/payslips"
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-[var(--color-surface-main)]/60 hover:bg-[var(--color-surface-main)] border border-[var(--color-line-subtle)] hover:border-[var(--color-brand-subtle)] transition-all duration-200 text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-[var(--color-content-main)] block">Review Salary Payslips</span>
                      <span className="text-[11px] text-[var(--color-content-secondary)]">Dispatch salary and tax records</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--color-content-muted)] group-hover:text-[var(--color-content-secondary)] group-hover:translate-x-0.5 transition" />
                </a>
              </div>

              <div className="pt-4 border-t border-[var(--color-line-subtle)] text-center">
                <span className="text-xs text-[var(--color-content-muted)]">
                  Need help? Read the{" "}
                  <a href="#" className="text-[var(--color-brand-accent)] hover:text-[var(--color-brand-hover)] hover:underline transition">
                    HR Playbook
                  </a>
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
          errorMessage={getFriendlyErrorMessage(addEmployeeError)}
          onSave={handleCreateEmployee}
        />
      </div>
    </div>
  );
}