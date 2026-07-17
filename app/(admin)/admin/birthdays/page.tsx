"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Filter, Calendar, RefreshCw } from "lucide-react";

import { EmployeeBirthday } from "@/lib/types";
import { MetricCard } from "@/app/components/admin/dashbord/MetricCard";
import { CustomDropdown } from "@/app/components/admin/birthday/CustomDropdown";
import { CalendarView } from "@/app/components/admin/birthday/CalendarView";
import { EmployeeRow } from "@/app/components/admin/birthday/EmployeeRow";
import { EmployeeModal } from "@/app/components/admin/birthday/EmployeeModal";

// Helper utilities
const getInitials = (name: string) => {
  if (!name) return "U";
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const getMonthLabel = (val: string) => {
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];
  if (val === "all") return "All Months";
  const idx = parseInt(val);
  return months[idx] || "Select Month";
};

const formatBirthdate = (day: number, monthIdx: number) => {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return `${months[monthIdx]} ${day}`;
};

export default function BirthdayDashboard() {
  const todayDate = useMemo(() => new Date(), []);
  const currentMonthIdx = todayDate.getMonth();
  const currentDayNum = todayDate.getDate();

  // API Data states
  const [employees, setEmployees] = useState<EmployeeBirthday[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [metrics, setMetrics] = useState({ todayCount: 0, monthCount: 0, upcomingCount: 0 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState(String(currentMonthIdx));
  const [activeTab, setActiveTab] = useState<"month" | "today" | "upcoming" | "calendar">("month");
  const [selectedEmp, setSelectedEmp] = useState<EmployeeBirthday | null>(null);

  const [monthLabelTab, setMonthLabelTab] = useState<string>(getMonthLabel(String(currentMonthIdx)));

  useEffect(() => {
    setMonthLabelTab(getMonthLabel(monthFilter));
  }, [monthFilter]);

  // Fetch from route.ts api
  const fetchBirthdayRecords = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        month: monthFilter,
        department: deptFilter,
        search: search
      });
      const res = await fetch(`/api/admin/birthdays?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
        setMetrics(data.metrics || { todayCount: 0, monthCount: 0, upcomingCount: 0 });
        if (data.departments) {
          setDepartments(data.departments);
        }
      }
    } catch (error) {
      console.error("Error retrieving birthday records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBirthdayRecords();
  }, [monthFilter, deptFilter, search]);

  // Map dynamic departments from CompanyDetails schema for selection
  const deptOptions = useMemo(() => {
    const base = [{ value: "all", label: "All Departments" }];
    const fetched = departments.map((dept) => ({ value: dept, label: dept }));
    return [...base, ...fetched];
  }, [departments]);

  // Local tab processing
  const processedEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (activeTab === "today") {
        return emp.birthMonth === currentMonthIdx && emp.birthDay === currentDayNum;
      }
      if (activeTab === "upcoming") {
        if (emp.birthMonth === currentMonthIdx) {
          return emp.birthDay > currentDayNum;
        }
        return emp.birthMonth > currentMonthIdx;
      }
      return true; // "month" or "calendar" - filtered on the server already
    });
  }, [employees, activeTab, currentMonthIdx, currentDayNum]);

  return (
    <div className="min-h-screen bg-surface-main text-content-main pb-16">
      <div className=" space-y-6">
        
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-line-subtle">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-content-main flex items-center gap-2.5">
              Employee Birthdays
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-accent"></span>
              </span>
            </h1>
            <p className="text-xs text-content-secondary mt-1 font-semibold">
              Monitor active workspace birthday schedules, email statuses, and profiles.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchBirthdayRecords}
              className="btn-outline px-4 py-2 text-xs font-bold w-auto inline-flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-brand-accent" : ""}`} /> 
              Refresh Records
            </button>
          </div>
        </div>

        {/* Metric Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <MetricCard
            label="Today's Celebrants"
            value={metrics.todayCount}
            iconText="🎂"
          />
          <MetricCard
            label={monthFilter === "all" ? "All Months" : `Birthdays in ${monthLabelTab}`}
            value={metrics.monthCount}
            iconText="📅"
          />
          <MetricCard
            label="Upcoming Birthdays"
            value={metrics.upcomingCount}
            iconText="🎁"
          />
        </div>

        {/* Filter Controls Panel */}
        <div className="bg-surface-card border border-line-subtle rounded-2xl p-4 md:p-5 shadow-xs flex flex-col lg:flex-row gap-5 items-center justify-between w-full">
          <div className="relative w-full lg:flex-1 lg:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none select-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee name or designation..."
              className="form-input !pl-10 w-full text-xs py-3"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-5 w-full lg:w-auto lg:justify-end">
            <div className="w-full sm:w-auto">
              <CustomDropdown
                label="Department:"
                icon={<Filter className="w-3.5 h-3.5 text-brand-accent" />}
                selectedValue={deptFilter}
                onSelect={setDeptFilter}
                options={deptOptions}
              />
            </div>

            <div className="w-full sm:w-auto">
              <CustomDropdown
                label="Month:"
                icon={<Calendar className="w-3.5 h-3.5 text-brand-accent" />}
                selectedValue={monthFilter}
                onSelect={setMonthFilter}
                options={[
                  { value: "all", label: "All Months" },
                  ...[
                    "January", "February", "March", "April", "May", "June", 
                    "July", "August", "September", "October", "November", "December"
                  ].map((name, idx) => ({ value: String(idx), label: name }))
                ]}
              />
            </div>
          </div>
        </div>

        {/* Dynamic List Card Container */}
        <div className="table-card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-line-subtle px-4 sm:px-6 py-3.5 bg-surface-main/60 gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { 
                  id: "month", 
                  label: monthFilter === "all" ? "Selected Month" : `Selected Month (${monthLabelTab})` 
                },
                { id: "today", label: "Today" },
                { id: "upcoming", label: "Upcoming" },
                { id: "calendar", label: "Calendar View" },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                      isActive
                        ? "bg-surface-card text-brand-accent border-line-subtle shadow-2xs"
                        : "text-content-secondary border-transparent hover:text-content-main hover:bg-surface-card/40"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <span className="text-[10px] font-extrabold text-content-muted uppercase tracking-wider">
              {activeTab === "calendar" 
                ? `${monthFilter === "all" ? "Calendar" : monthLabelTab} Grid` 
                : `${processedEmployees.length} records matching`}
            </span>
          </div>

          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-2.5">
              <span className="w-7 h-7 border-2 border-line-subtle border-t-brand-accent rounded-full animate-spin" />
              <p className="text-xs text-content-secondary font-bold">Querying database records...</p>
            </div>
          ) : activeTab === "calendar" ? (
            <CalendarView 
              employees={employees} 
              currentDayNum={currentDayNum} 
              currentMonthIdx={currentMonthIdx}
              selectedMonthIdx={monthFilter === "all" ? currentMonthIdx : parseInt(monthFilter)}
              onSelectEmployee={setSelectedEmp} 
            />
          ) : processedEmployees.length === 0 ? (
            <div className="py-24 text-center px-4">
              <p className="text-xs font-bold text-content-main">No birthdays found.</p>
              <p className="text-[11px] text-content-muted mt-1 font-semibold">
                There are no employee birthdays matching the active parameters.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-line-subtle">
              {processedEmployees.map((emp) => (
                <EmployeeRow
                  key={emp.id}
                  employee={emp}
                  isToday={emp.birthMonth === currentMonthIdx && emp.birthDay === currentDayNum}
                  onViewDetails={setSelectedEmp}
                  formatBirthdate={formatBirthdate}
                  getInitials={getInitials}
                />
              ))}
            </div>
          )}
        </div>

      </div>

      {selectedEmp && (
        <EmployeeModal
          employee={selectedEmp}
          onClose={() => setSelectedEmp(null)}
          getInitials={getInitials}
          formatBirthdate={formatBirthdate}
        />
      )}
    </div>
  );
}