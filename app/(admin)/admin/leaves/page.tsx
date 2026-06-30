"use client";

import React, { useState } from "react";
import { 
  Check, 
  X, 
  Search, 
  Calendar, 
  FileText, 
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Filter
} from "lucide-react";

// Structure definition for Leave Records
interface LeaveRequest {
  id: number;
  employeeName: string;
  role: string;
  type: "Annual Leave" | "Sick Leave" | "Casual Leave" | "Unpaid Leave";
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
}

// Initial Mock Database rows
const initialLeaves: LeaveRequest[] = [
  {
    id: 1,
    employeeName: "Alexander Wright",
    role: "Senior Software Engineer",
    type: "Annual Leave",
    startDate: "2026-07-10",
    endDate: "2026-07-15",
    days: 5,
    reason: "Family vacation trip to Hawaii with relatives.",
    status: "Pending",
  },
  {
    id: 2,
    employeeName: "Sophia Martinez",
    role: "Lead Product Designer",
    type: "Sick Leave",
    startDate: "2026-06-20",
    endDate: "2026-06-22",
    days: 2,
    reason: "Severe seasonal fever and post-dental recovery.",
    status: "Approved",
  },
  {
    id: 3,
    employeeName: "Marcus Thompson",
    role: "HR Operations Lead",
    type: "Casual Leave",
    startDate: "2026-07-02",
    endDate: "2026-07-03",
    days: 1,
    reason: "Urgent banking tasks and relocation logistics.",
    status: "Pending",
  },
  {
    id: 4,
    employeeName: "Liam Parker",
    role: "Frontend Engineer",
    type: "Unpaid Leave",
    startDate: "2026-08-01",
    endDate: "2026-08-07",
    days: 7,
    reason: "Attending private professional developer conference in Tokyo.",
    status: "Rejected",
  },
  {
    id: 5,
    employeeName: "Emma Watson",
    role: "Marketing Specialist",
    type: "Annual Leave",
    startDate: "2026-07-25",
    endDate: "2026-07-28",
    days: 3,
    reason: "Sisters wedding ceremonies and personal setup assistance.",
    status: "Pending",
  },
];

export default function AdminLeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>(initialLeaves);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");

  // Dynamic status update handlers
  const handleApprove = (id: number) => {
    setLeaves((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "Approved" } : item))
    );
  };

  const handleReject = (id: number) => {
    setLeaves((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "Rejected" } : item))
    );
  };

  // Filter operations
  const filteredLeaves = leaves.filter((leave) => {
    const matchesSearch =
      leave.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leave.reason.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === "All" || leave.status === activeTab;

    return matchesSearch && matchesTab;
  });

  // Simple status styling mapping
  const getStatusBadgeStyles = (status: "Pending" | "Approved" | "Rejected") => {
    switch (status) {
      case "Approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "Rejected":
        return "bg-rose-50 text-rose-700 border-rose-100";
      default:
        return "bg-amber-50 text-amber-700 border-amber-100";
    }
  };

  const getLeaveTypeStyles = (type: string) => {
    switch (type) {
      case "Annual Leave":
        return "bg-indigo-50 text-indigo-700 border-indigo-100";
      case "Sick Leave":
        return "bg-red-50 text-red-700 border-red-100";
      case "Casual Leave":
        return "bg-sky-50 text-sky-700 border-sky-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Leave Manager</h1>
          <p className="mt-1 text-xs text-slate-500">
            Review, approve, and filter all employee leave requests and historical records.
          </p>
        </div>

        {/* Dynamic Search Bar */}
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search employee, type, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
          />
        </div>
      </div>

      {/* 2. Management Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Tab Controls Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-wrap gap-1.5">
            {(["All", "Pending", "Approved", "Rejected"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Showing {filteredLeaves.length} leaves</span>
          </div>
        </div>

        {/* HTML Table Layout */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Leave Type</th>
                <th className="px-6 py-4">Duration & Dates</th>
                <th className="px-6 py-4 max-w-xs">Reason</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-750 text-xs">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-6 h-6 text-slate-300" />
                      <span>No matching leave records found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => {
                  const initials = leave.employeeName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={leave.id} className="hover:bg-slate-50/40 transition">
                      {/* Employee Identification */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center font-bold text-[11px]">
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {leave.employeeName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                              {leave.role}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Leave Category Badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase border ${getLeaveTypeStyles(leave.type)}`}>
                          {leave.type}
                        </span>
                      </td>

                      {/* Leave Duration & Dates */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {leave.days} {leave.days === 1 ? "day" : "days"}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1">
                            {leave.startDate} to {leave.endDate}
                          </span>
                        </div>
                      </td>

                      {/* Reason Column (max-w handling layout truncation) */}
                      <td className="px-6 py-4 max-w-xs">
                        <div className="flex items-start gap-1.5 text-slate-600 leading-normal">
                          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                          <span className="truncate block" title={leave.reason}>
                            {leave.reason}
                          </span>
                        </div>
                      </td>

                      {/* Status Column */}
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border ${getStatusBadgeStyles(leave.status)}`}>
                            {leave.status === "Approved" && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                            {leave.status === "Rejected" && <XCircle className="w-3 h-3 text-rose-500" />}
                            {leave.status === "Pending" && <Clock className="w-3 h-3 text-amber-500" />}
                            {leave.status}
                          </span>
                        </div>
                      </td>

                      {/* Contextual Action Items */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {leave.status === "Pending" ? (
                            <>
                              <button
                                onClick={() => handleApprove(leave.id)}
                                title="Approve Leave"
                                className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition"
                              >
                                <Check className="w-4 h-4 stroke-[2.5]" />
                              </button>
                              <button
                                onClick={() => handleReject(leave.id)}
                                title="Reject Leave"
                                className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
                              >
                                <X className="w-4 h-4 stroke-[2.5]" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-semibold italic pr-2">
                              Archived
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}