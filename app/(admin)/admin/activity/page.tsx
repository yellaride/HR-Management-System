"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, Calendar, RefreshCw, CheckSquare, Heart, User } from "lucide-react";

interface Activity {
  _id: string;
  user: string;
  designation?: string;
  action: string;
  type: string;
  createdAt: string;
}

function ActivityLogPage() {
  const [logs, setLogs] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (search) params.append("search", search);

      const res = await fetch(`/api/admin/activity?${params.toString()}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        let fetchedLogs = data.logs || [];

        // Apply interactive client-side date filters
        if (dateFilter !== "all") {
          const now = new Date();
          const startOfToday = new Date(now.setHours(0, 0, 0, 0));

          fetchedLogs = fetchedLogs.filter((log: Activity) => {
            const logDate = new Date(log.createdAt);
            if (dateFilter === "today") {
              return logDate >= startOfToday;
            } else if (dateFilter === "week") {
              const sevenDaysAgo = new Date();
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
              return logDate >= sevenDaysAgo;
            } else if (dateFilter === "month") {
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              return logDate >= thirtyDaysAgo;
            }
            return true;
          });
        }

        setLogs(fetchedLogs);
      }
    } catch (e) {
      console.error("Error fetching logs database:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchLogs();
    }, 300); // 300ms input debounce
    return () => clearTimeout(delayDebounce);
  }, [search, typeFilter, dateFilter]);

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

  const getActivityConfig = (type: string) => {
    switch (type) {
      case "attendance":
        return {
          icon: CheckSquare,
          badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
          label: "Attendance",
        };
      case "leave":
        return {
          icon: Calendar,
          badge: "bg-amber-50 text-amber-700 border-amber-100",
          label: "Leave Request",
        };
      case "birthday":
        return {
          icon: Heart,
          badge: "bg-pink-50 text-pink-700 border-pink-100",
          label: "Birthday Celebration",
        };
      default:
        return {
          icon: User,
          badge: "bg-slate-50 text-slate-700 border-slate-100",
          label: "System Log",
        };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return "N/A";
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f8fc] text-[#181124] pb-16">
      <div className="  pr-2 py-10 space-y-6">
        
        {/* Page Title & Navigation Area */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[#e2e0e8]">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#181124] flex items-center gap-3">
              System Activity Logs
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7c3aed] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#7c3aed]"></span>
              </span>
            </h1>
            <p className="text-xs text-[#534a60] mt-1.5 font-medium">
              Real-time administrative feed tracking attendance records, leave queries, and employee birthdays.
            </p>
          </div>

          <button
            onClick={fetchLogs}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-[#f9f8fc] border border-[#e2e0e8] rounded-xl text-xs font-bold text-[#534a60] shadow-xs transition hover:text-[#7c3aed] hover:border-[#7c3aed]/40 active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
          </button>
        </div>

        {/* Filter Controls Panel */}
        <div className="bg-white border border-[#e2e0e8] rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8e859c]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee name or log keyword..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#f9f8fc] border border-[#e2e0e8] rounded-xl text-xs text-[#181124] placeholder-[#8e859c] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/25 focus:border-[#7c3aed] transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            {/* Filter Dropdown (Attendance, Leaves, and Birthdays only) */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-[#534a60] flex items-center gap-1.5 shrink-0">
                <Filter className="w-3.5 h-3.5 text-[#7c3aed]" /> Filter:
              </span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full sm:w-auto bg-[#f9f8fc] border border-[#e2e0e8] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#181124] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="attendance">Attendance</option>
                <option value="leave">Leaves</option>
                <option value="birthday">Birthdays</option>
              </select>
            </div>

            {/* Time Range Filter */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-[#534a60] flex items-center gap-1.5 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-[#7c3aed]" /> Range:
              </span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full sm:w-auto bg-[#f9f8fc] border border-[#e2e0e8] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#181124] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 focus:border-[#7c3aed] cursor-pointer"
              >
                <option value="all">All History</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic Activity List Container */}
        <div className="bg-white border border-[#e2e0e8] rounded-2xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <span className="w-8 h-8 border-3 border-[#e2e0e8] border-t-[#7c3aed] rounded-full animate-spin" />
              <p className="text-xs text-[#534a60] font-medium">Querying organizational feed...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-sm font-semibold text-[#181124]">No matching logs found.</p>
              <p className="text-xs text-[#8e859c] mt-1">Try resetting selected parameters or search input.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#e2e0e8]">
              {logs.map((log) => {
                const config = getActivityConfig(log.type);
                const Icon = config.icon;
                return (
                  <div key={log._id} className="p-4 sm:px-6 hover:bg-[#f9f8fc]/60 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* Initials Avatar */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 select-none border shadow-2xs transition-all duration-200 ${config.badge}`}>
                        {getInitials(log.user)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#181124] text-sm tracking-tight">{log.user}</span>
                          {log.designation && (
                            <span className="text-[10px] font-bold bg-[#ede9fe] text-[#7c3aed] px-2 py-0.5 rounded-md border border-[#7c3aed]/10 tracking-wide uppercase">
                              {log.designation}
                            </span>
                          )}
                          <span className="text-[#534a60] text-xs sm:text-sm font-medium">{log.action}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold border tracking-wider uppercase ${config.badge}`}>
                            <Icon className="w-3 h-3" /> {config.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold text-[#534a60]">
                        {formatDate(log.createdAt)}
                      </span>
                      <span className="text-[10px] text-[#8e859c] font-semibold">
                        {formatTime(log.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default ActivityLogPage;