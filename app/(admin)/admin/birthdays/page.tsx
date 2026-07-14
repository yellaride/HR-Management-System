"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Search, 
  Filter, 
  Calendar, 
  RefreshCw, 
  Gift, 
  User, 
  ChevronDown, 
  Eye, 
  Clock, 
  CheckSquare 
} from "lucide-react";

interface EmployeeBirthday {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  birthDate: string; // YYYY-MM-DD
  birthDay: number;
  birthMonth: number; // 0-indexed (e.g., 6 = July)
  visibility: "everyone" | "admin" | "hidden";
  emailStatus: "Sent" | "Scheduled" | "Pending";
}

const SEED_EMPLOYEES: EmployeeBirthday[] = [
  {
    id: "EMP-101",
    name: "Alvina Vance",
    email: "alvina.v@company.com",
    department: "Engineering",
    designation: "Lead Frontend Engineer",
    birthDate: "1995-07-03",
    birthDay: 3,
    birthMonth: 6, // July
    visibility: "everyone",
    emailStatus: "Sent",
  },
  {
    id: "EMP-102",
    name: "Darian Sterling",
    email: "darian.s@company.com",
    department: "Product Management",
    designation: "Senior PM",
    birthDate: "1992-07-11", // Today (Mock date: July 11, 2026)
    birthDay: 11,
    birthMonth: 6, // July
    visibility: "everyone",
    emailStatus: "Sent",
  },
  {
    id: "EMP-103",
    name: "Genevieve Thorne",
    email: "genevieve.t@company.com",
    department: "Operations",
    designation: "Operations Lead",
    birthDate: "1994-07-15", // Upcoming
    birthDay: 15,
    birthMonth: 6, // July
    visibility: "everyone",
    emailStatus: "Scheduled",
  },
  {
    id: "EMP-104",
    name: "Julian Mercer",
    email: "julian.m@company.com",
    department: "Marketing",
    designation: "Creative Director",
    birthDate: "1990-07-28", // This Month
    birthDay: 28,
    birthMonth: 6, // July
    visibility: "everyone",
    emailStatus: "Scheduled",
  },
  {
    id: "EMP-105",
    name: "Cecelia Sterling",
    email: "cecelia.s@company.com",
    department: "Finance",
    designation: "Principal Analyst",
    birthDate: "1988-08-05", // August
    birthDay: 5,
    birthMonth: 7, // August
    visibility: "everyone",
    emailStatus: "Pending",
  },
  {
    id: "EMP-106",
    name: "Marcus Vance",
    email: "marcus.v@company.com",
    department: "Engineering",
    designation: "DevOps Architect",
    birthDate: "1991-07-10", // Yesterday
    birthDay: 10,
    birthMonth: 6, // July
    visibility: "everyone",
    emailStatus: "Sent",
  },
  {
    id: "EMP-107",
    name: "Valerie Cole",
    email: "valerie.c@company.com",
    department: "Legal Office",
    designation: "Corporate Counsel",
    birthDate: "1989-07-12", // Tomorrow (July 12)
    birthDay: 12,
    birthMonth: 6, // July
    visibility: "admin", // Admin only visible
    emailStatus: "Scheduled",
  }
];

export default function BirthdayDashboard() {
  // Mock constant current system time context (July 11, 2026)
  const currentSystemDate = useMemo(() => new Date(2026, 6, 11), []);
  const currentMonthIdx = 6; // July
  const currentDayNum = 11;

  const [employees, setEmployees] = useState<EmployeeBirthday[]>(SEED_EMPLOYEES);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("6"); // Defaults focused on July (Current Month)
  
  // Tab control matching leave tables style
  const [activeTab, setActiveTab] = useState<"month" | "today" | "upcoming" | "calendar">("month");
  
  // Custom Dropdown Open States
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isMonthOpen, setIsMonthOpen] = useState(false);

  // Dropdown Refs for Click Outside Handlers
  const deptRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);

  // Detail Modal selection state
  const [selectedEmp, setSelectedEmp] = useState<EmployeeBirthday | null>(null);

  // Settings states inside page
  const [isAutoWishesEnabled, setIsAutoWishesEnabled] = useState(true);

  // Trigger manual wish operation
  const handleManualWish = (empId: string) => {
    setEmployees(prev => prev.map(emp => emp.id === empId ? { ...emp, emailStatus: "Sent" } : emp));
    const target = employees.find(e => e.id === empId);
    if (target) {
      alert(`Manual birthday wish dispatched successfully to ${target.name} (${target.email})`);
    }
    setSelectedEmp(null);
  };

  // Click Outside Handler for Custom Dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (deptRef.current && !deptRef.current.contains(target)) {
        setIsDeptOpen(false);
      }
      if (monthRef.current && !monthRef.current.contains(target)) {
        setIsMonthOpen(false);
      }
    }

    if (isDeptOpen || isMonthOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDeptOpen, isMonthOpen]);

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

  const getDeptLabel = (val: string) => {
    if (val === "all") return "All Departments";
    return val;
  };

  const formatBirthdate = (day: number, monthIdx: number) => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return `${months[monthIdx]} ${day}`;
  };

  // Refresh database mock action
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 450);
  };

  // Metrics Count Calculation
  const metrics = useMemo(() => {
    let todayCount = 0;
    let monthCount = 0;
    let upcomingCount = 0;

    employees.forEach(emp => {
      if (emp.birthMonth === currentMonthIdx) {
        monthCount++;
        if (emp.birthDay === currentDayNum) {
          todayCount++;
        } else if (emp.birthDay > currentDayNum) {
          upcomingCount++;
        }
      } else if (emp.birthMonth > currentMonthIdx) {
        upcomingCount++;
      }
    });

    return { todayCount, monthCount, upcomingCount };
  }, [employees, currentMonthIdx, currentDayNum]);

  // Combined Filters processing (Search + Dropdowns + Tabs)
  const processedEmployees = useMemo(() => {
    return employees.filter(emp => {
      // 1. Dropdown and search filters
      const matchesSearch = emp.name.toLowerCase().includes(search.toLowerCase()) ||
                            emp.designation.toLowerCase().includes(search.toLowerCase());
      const matchesDept = deptFilter === "all" || emp.department === deptFilter;
      const matchesMonth = monthFilter === "all" || emp.birthMonth === parseInt(monthFilter);

      if (!matchesSearch || !matchesDept || !matchesMonth) return false;

      // 2. Tab filtering logic
      if (activeTab === "today") {
        return emp.birthMonth === currentMonthIdx && emp.birthDay === currentDayNum;
      }
      if (activeTab === "upcoming") {
        // Birthdays later today, or later this month, or in future months
        if (emp.birthMonth === currentMonthIdx) {
          return emp.birthDay > currentDayNum;
        }
        return emp.birthMonth > currentMonthIdx;
      }
      if (activeTab === "month") {
        return emp.birthMonth === currentMonthIdx;
      }

      return true; // Calendar has custom full view below
    });
  }, [employees, search, deptFilter, monthFilter, activeTab, currentMonthIdx, currentDayNum]);

  // Calendar Calculation engine
  const calendarCells = useMemo(() => {
    const daysInJuly = 31; // For July 2026
    const startOffset = 3; // July 1, 2026 is a Wednesday (Offset 3 empty slots)
    
    const days: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInJuly; d++) {
      days.push(d);
    }
    return days;
  }, []);

  return (
    <div className="min-h-screen bg-[#f9f8fc] text-[#181124] pb-16">
      <div className="space-y-6">
        
        {/* Page Title & Realtime Indicator */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#e2e0e8]">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#181124] flex items-center gap-3">
              Employee Birthdays
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7c3aed] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#7c3aed]"></span>
              </span>
            </h1>
            <p className="text-xs text-[#534a60] mt-1.5 font-medium">
              Monitor workspace birthday rosters, configure automation schedules, and track dispatch channels.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-[#f9f8fc] border border-[#e2e0e8] rounded-xl text-xs font-bold text-[#534a60] shadow-xs transition hover:text-[#7c3aed] hover:border-[#7c3aed]/40 active:scale-95 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#7c3aed]" : ""}`} /> 
              Refresh Board
            </button>
          </div>
        </div>

        {/* Cohesive Metric Card Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#e2e0e8] rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8e859c]">Today's Celebrants</p>
              <h3 className="text-2xl font-black mt-1 text-[#181124]">{metrics.todayCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-700 border border-pink-100 flex items-center justify-center text-lg">
              🎂
            </div>
          </div>

          <div className="bg-white border border-[#e2e0e8] rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8e859c]">This Month ({getMonthLabel("6")})</p>
              <h3 className="text-2xl font-black mt-1 text-[#181124]">{metrics.monthCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#ede9fe] text-[#7c3aed] border border-[#7c3aed]/10 flex items-center justify-center text-lg">
              📅
            </div>
          </div>

          <div className="bg-white border border-[#e2e0e8] rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8e859c]">Upcoming Wishes</p>
              <h3 className="text-2xl font-black mt-1 text-[#181124]">{metrics.upcomingCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center text-lg">
              🎁
            </div>
          </div>

          <div className="bg-white border border-[#e2e0e8] rounded-2xl p-5 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8e859c]">Automated Messages</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`h-2 w-2 rounded-full ${isAutoWishesEnabled ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                <span className="text-xs font-bold text-[#181124]">
                  {isAutoWishesEnabled ? "Active (9:00 AM)" : "Deactivated"}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsAutoWishesEnabled(!isAutoWishesEnabled)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold border uppercase tracking-wider transition ${
                isAutoWishesEnabled 
                  ? "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100" 
                  : "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
              }`}
            >
              {isAutoWishesEnabled ? "Disable" : "Enable"}
            </button>
          </div>
        </div>

        {/* Filter Controls Panel */}
        <div className="bg-white border border-[#e2e0e8] rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e859c]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee name or designation..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#f9f8fc] border border-[#e2e0e8] rounded-xl text-xs text-[#181124] placeholder-[#8e859c] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/25 focus:border-[#7c3aed] transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            {/* Department Selector */}
            <div className="flex items-center gap-2 w-full sm:w-auto relative" ref={deptRef}>
              <span className="text-xs font-semibold text-[#534a60] flex items-center gap-1.5 shrink-0">
                <Filter className="w-3.5 h-3.5 text-[#7c3aed]" /> Department:
              </span>
              <div className="relative w-full sm:w-44">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeptOpen(!isDeptOpen);
                    setIsMonthOpen(false);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e2e0e8] rounded-xl text-xs font-bold text-[#181124] flex items-center justify-between cursor-pointer hover:border-[#7c3aed]/40 focus:ring-2 focus:ring-[#7c3aed]/20 transition shadow-xs"
                >
                  <span className="truncate">{getDeptLabel(deptFilter)}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#8e859c] transition-transform duration-200 shrink-0 ${isDeptOpen ? "rotate-180" : ""}`} />
                </button>

                {isDeptOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-white border border-[#e2e0e8] rounded-xl shadow-lg py-1 z-50">
                    {[
                      { value: "all", label: "All Departments" },
                      { value: "Engineering", label: "Engineering" },
                      { value: "Product Management", label: "Product Management" },
                      { value: "Operations", label: "Operations" },
                      { value: "Marketing", label: "Marketing" },
                      { value: "Finance", label: "Finance" },
                      { value: "Legal Office", label: "Legal Office" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setDeptFilter(opt.value);
                          setIsDeptOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                          deptFilter === opt.value
                            ? "bg-[#f4f0ff] text-[#7c3aed]"
                            : "text-[#534a60] hover:bg-[#f9f8fc] hover:text-[#181124]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Month Filter Selector */}
            <div className="flex items-center gap-2 w-full sm:w-auto relative" ref={monthRef}>
              <span className="text-xs font-semibold text-[#534a60] flex items-center gap-1.5 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-[#7c3aed]" /> Month:
              </span>
              <div className="relative w-full sm:w-44">
                <button
                  type="button"
                  onClick={() => {
                    setIsMonthOpen(!isMonthOpen);
                    setIsDeptOpen(false);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e2e0e8] rounded-xl text-xs font-bold text-[#181124] flex items-center justify-between cursor-pointer hover:border-[#7c3aed]/40 focus:ring-2 focus:ring-[#7c3aed]/20 transition shadow-xs"
                >
                  <span className="truncate">{getMonthLabel(monthFilter)}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#8e859c] transition-transform duration-200 shrink-0 ${isMonthOpen ? "rotate-180" : ""}`} />
                </button>

                {isMonthOpen && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-white border border-[#e2e0e8] rounded-xl shadow-lg py-1 z-50">
                    <button
                      type="button"
                      onClick={() => {
                        setMonthFilter("all");
                        setIsMonthOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                        monthFilter === "all" ? "bg-[#f4f0ff] text-[#7c3aed]" : "text-[#534a60] hover:bg-[#f9f8fc] hover:text-[#181124]"
                      }`}
                    >
                      All Months
                    </button>
                    {[
                      "January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"
                    ].map((name, idx) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setMonthFilter(String(idx));
                          setIsMonthOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                          monthFilter === String(idx)
                            ? "bg-[#f4f0ff] text-[#7c3aed]"
                            : "text-[#534a60] hover:bg-[#f9f8fc] hover:text-[#181124]"
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic List Card Container */}
        <div className="bg-white border border-[#e2e0e8] rounded-2xl shadow-xs overflow-hidden">
          
          {/* Custom Header Tabs Bar (Leave Filters Style) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#e2e0e8] px-4 sm:px-6 py-3 bg-[#f9f8fc]/40 gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "month", label: "This Month (July)" },
                { id: "today", label: "Today" },
                { id: "upcoming", label: "Upcoming" },
                { id: "calendar", label: "Calendar View" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-white text-[#7c3aed] border border-[#e2e0e8] shadow-2xs"
                      : "text-[#534a60] hover:text-[#181124] hover:bg-white/50"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <span className="text-[10px] font-bold text-[#8e859c] uppercase tracking-wide">
              {activeTab === "calendar" ? "July 2026 Grid" : `${processedEmployees.length} records matching`}
            </span>
          </div>

          {/* Table list execution */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <span className="w-8 h-8 border-3 border-[#e2e0e8] border-t-[#7c3aed] rounded-full animate-spin" />
              <p className="text-xs text-[#534a60] font-medium">Querying birthday rosters...</p>
            </div>
          ) : activeTab === "calendar" ? (
            /* Calendar View Integration */
            <div className="p-6">
              <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black uppercase tracking-wider text-[#8e859c] pb-3 border-b border-[#e2e0e8] mb-3">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

              <div className="grid grid-cols-7 gap-2.5">
                {calendarCells.map((day, idx) => {
                  if (day === null) {
                    return <div key={`empty-${idx}`} className="bg-[#f9f8fc]/40 rounded-xl min-h-[70px] md:min-h-[90px]" />;
                  }

                  const matches = employees.filter(emp => emp.birthMonth === 6 && emp.birthDay === day);
                  const isTodayHighlight = day === currentDayNum;

                  return (
                    <div 
                      key={`day-${day}`}
                      onClick={() => {
                        if (matches.length > 0) {
                          setSelectedEmp(matches[0]);
                        }
                      }}
                      className={`border border-[#e2e0e8] rounded-xl p-2 min-h-[70px] md:min-h-[90px] flex flex-col justify-between transition-all relative ${
                        isTodayHighlight ? "bg-pink-50/50 border-pink-200 shadow-2xs" : "bg-white hover:border-[#7c3aed]/40"
                      } ${matches.length > 0 ? "cursor-pointer" : ""}`}
                    >
                      <span className={`text-[11px] font-bold ${isTodayHighlight ? "text-pink-700 font-extrabold" : "text-[#534a60]"}`}>
                        {day}
                      </span>

                      <div className="space-y-1.5">
                        {matches.map(m => (
                          <div 
                            key={m.id}
                            className="bg-pink-50 border border-pink-100 text-pink-700 text-[9px] px-2 py-1 rounded-lg font-bold truncate leading-none text-left"
                            title={`${m.name} - ${m.designation}`}
                          >
                            🎉 {m.name.split(" ")[0]}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : processedEmployees.length === 0 ? (
            /* Empty State block */
            <div className="py-24 text-center px-4">
              <p className="text-sm font-semibold text-[#181124]">No birthdays found.</p>
              <p className="text-xs text-[#8e859c] mt-1">There are no employee birthdays scheduled for this filter criterion.</p>
            </div>
          ) : (
            /* Interactive Data Grid Rows */
            <div className="divide-y divide-[#e2e0e8]">
              {processedEmployees.map((emp) => {
                const isToday = emp.birthMonth === currentMonthIdx && emp.birthDay === currentDayNum;
                return (
                  <div key={emp.id} className={`p-4 sm:px-6 hover:bg-[#f9f8fc]/60 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${isToday ? "bg-pink-50/20 border-l-4 border-pink-400" : ""}`}>
                    
                    <div className="flex items-center gap-4">
                      {/* User Initials Badge */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 select-none border shadow-2xs transition-all duration-200 ${
                        isToday ? "bg-pink-100 text-pink-700 border-pink-200" : "bg-[#ede9fe] text-[#7c3aed] border-[#7c3aed]/10"
                      }`}>
                        {getInitials(emp.name)}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#181124] text-sm tracking-tight">{emp.name}</span>
                          <span className="text-[10px] font-bold bg-[#ede9fe] text-[#7c3aed] px-2 py-0.5 rounded-md border border-[#7c3aed]/10 tracking-wide uppercase">
                            {emp.department}
                          </span>
                          {isToday && (
                            <span className="text-[10px] font-bold bg-pink-100 text-pink-700 px-2 py-0.5 rounded-md border border-pink-200 tracking-wide uppercase animate-pulse">
                              Celebrating Today! 🎂
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-[#534a60]">{emp.designation}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-row items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      <div className="text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                        <span className="text-xs font-bold text-[#534a60] flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#7c3aed]" />
                          {formatBirthdate(emp.birthDay, emp.birthMonth)}
                        </span>
                        <span className="text-[10px] text-[#8e859c] font-semibold">
                          Birth Year: {emp.birthDate.split("-")[0]}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Visibility check indicators */}
                        {emp.visibility === "everyone" ? (
                          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
                            <Eye className="w-3 h-3" /> Public
                          </span>
                        ) : (
                          <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 uppercase tracking-wider">
                            <Clock className="w-3 h-3" /> Hidden / Admin
                          </span>
                        )}

                        <button
                          onClick={() => setSelectedEmp(emp)}
                          className="px-3 py-2 bg-white hover:bg-[#f9f8fc] border border-[#e2e0e8] rounded-xl text-xs font-bold text-[#534a60] transition hover:text-[#7c3aed] hover:border-[#7c3aed]/40 active:scale-95 cursor-pointer"
                        >
                          Review & Wish
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Birthday Details & Wish Dispatcher Modal */}
      {selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#181124]/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#e2e0e8] rounded-2xl p-6 sm:p-8 max-w-md w-full relative space-y-6 shadow-xl animate-in zoom-in-95 duration-150">
            
            {/* Close button */}
            <button 
              onClick={() => setSelectedEmp(null)} 
              className="absolute top-4 right-4 text-xs font-bold text-[#8e859c] hover:text-[#181124] cursor-pointer"
            >
              ✕
            </button>

            {/* Profile Avatar Container */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center font-bold text-lg bg-[#ede9fe] text-[#7c3aed] border border-[#7c3aed]/15 shadow-sm">
                {getInitials(selectedEmp.name)}
              </div>
              <h3 className="text-lg font-black text-[#181124] tracking-tight">{selectedEmp.name}</h3>
              <p className="text-xs font-bold text-[#7c3aed]">{selectedEmp.designation}</p>
            </div>

            {/* Birthday specs card list */}
            <div className="space-y-3 bg-[#f9f8fc] p-4 rounded-xl border border-[#e2e0e8] text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e859c]">Corporate Email</span>
                <span className="font-semibold text-[#181124]">{selectedEmp.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e859c]">Department</span>
                <span className="font-semibold text-[#181124]">{selectedEmp.department}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e859c]">Celebration Date</span>
                <span className="font-extrabold text-[#7c3aed]">
                  {formatBirthdate(selectedEmp.birthDay, selectedEmp.birthMonth)} (Age: {2026 - parseInt(selectedEmp.birthDate.split("-")[0])})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8e859c]">Email Dispatch Log</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold border tracking-wider uppercase ${
                  selectedEmp.emailStatus === "Sent" 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                    : "bg-blue-50 text-blue-700 border-blue-100"
                }`}>
                  {selectedEmp.emailStatus}
                </span>
              </div>
            </div>

            {/* Custom privacy toggle */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8e859c] block">
                Roster Privacy Configuration
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmployees(prev => prev.map(emp => emp.id === selectedEmp.id ? { ...emp, visibility: "everyone" } : emp));
                    setSelectedEmp(prev => prev ? { ...prev, visibility: "everyone" } : null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                    selectedEmp.visibility === "everyone"
                      ? "bg-[#7c3aed] text-white border-transparent shadow-xs"
                      : "bg-white border-[#e2e0e8] text-[#534a60] hover:bg-[#f9f8fc]"
                  }`}
                >
                  Show Everyone
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmployees(prev => prev.map(emp => emp.id === selectedEmp.id ? { ...emp, visibility: "admin" } : emp));
                    setSelectedEmp(prev => prev ? { ...prev, visibility: "admin" } : null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                    selectedEmp.visibility !== "everyone"
                      ? "bg-[#7c3aed] text-white border-transparent shadow-xs"
                      : "bg-white border-[#e2e0e8] text-[#534a60] hover:bg-[#f9f8fc]"
                  }`}
                >
                  Admin Only
                </button>
              </div>
            </div>

            {/* Dynamic Interactive custom message test wish action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleManualWish(selectedEmp.id)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Gift className="w-4 h-4" /> Send Instant Wishes
              </button>
              <button
                type="button"
                onClick={() => setSelectedEmp(null)}
                className="px-6 py-3 bg-white hover:bg-[#f9f8fc] border border-[#e2e0e8] rounded-xl text-xs font-bold text-[#534a60] transition cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}