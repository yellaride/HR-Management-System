"use client";

import React from "react";
import { 
  AlertCircle, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye 
} from "lucide-react";

// Import the centralized LeaveRequest type. 
import { LeaveRequest } from "@/lib/types";

interface LeaveTableProps {
  leaves: LeaveRequest[];
  loading: boolean;
  onSelect: (leave: LeaveRequest) => void;
}
export const LeaveTable: React.FC<LeaveTableProps> = ({
  leaves,
  loading,
  onSelect,
}) => {
  // Case-insensitive status mapping to support fallback values
  const getStatusBadgeStyles = (status?: string) => {
    const s = String(status || "").toUpperCase();
    if (s === "APPROVED" || s === "APPROVE") {
      return "bg-emerald-50/80 text-emerald-700 border-emerald-100";
    }
    if (s === "REJECTED" || s === "REJECT") {
      return "bg-rose-50/80 text-rose-700 border-rose-100";
    }
    return "bg-amber-50/80 text-amber-700 border-amber-100";
  };

  // Case-insensitive leave type mapping (uses safe defaults if variables are uninitialized)
  const getLeaveTypeStyles = (type?: string) => {
    const t = String(type || "").toUpperCase();
    if (t.includes("ANNUAL")) {
      return "bg-indigo-50 text-indigo-700 border-indigo-100";
    }
    if (t.includes("SICK")) {
      return "bg-red-50 text-red-700 border-red-100";
    }
    if (t.includes("CASUAL")) {
      return "bg-sky-50 text-sky-700 border-sky-100";
    }
    if (t.includes("UNPAID")) {
      return "bg-slate-100 text-slate-700 border-slate-200";
    }
    // Safe standard fallback styling in case CSS theme variables are not defined in stylesheet
    return "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700";
  };

  // Resolve leave type consistently from multiple possible backend keys.
  // Backend currently sends: { type: "Annual Leave" | "Sick Leave" | ... , typeUpper: "ANNUAL" | "SICK" | "CASUAL" }
  const resolveLeaveTypeTitle = (leave: LeaveRequest) => {
    const anyLeave = leave as any;

    const titleFromType = leave.type; // expected title-case
    if (titleFromType) return titleFromType;

    const titleFromLegacy = anyLeave.leaveType as string | undefined;
    if (titleFromLegacy) return titleFromLegacy;

    const key = String(anyLeave.typeUpper || "").toUpperCase();
    if (key === "ANNUAL") return "Annual Leave";
    if (key === "SICK") return "Sick Leave";
    if (key === "CASUAL") return "Casual Leave";
    if (key === "UNPAID") return "Unpaid Leave";

    return "Other Leave";
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-[var(--color-content-muted)]">
        <div className="flex justify-center items-center gap-2">
          <div className="w-4 h-4 border-2 border-[var(--color-brand-accent)] border-t-transparent rounded-full animate-spin" />
          <span>Loading leave records...</span>
        </div>
      </div>
    );
  }

  if (leaves.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-[var(--color-content-muted)]">
        <div className="flex flex-col items-center justify-center gap-2">
          <AlertCircle className="w-6 h-6 text-[var(--color-content-muted)]/70" />
          <span>No matching leave records found.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto vertical-slider-reset">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="table-head">
            <th className="table-cell">Employee</th>
            <th className="table-cell">Designation</th>
            <th className="table-cell">Leave Type</th>
            <th className="table-cell">Duration & Dates</th>
            <th className="table-cell max-w-xs">Reason</th>
            <th className="table-cell text-center">Status</th>
            <th className="table-cell text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-line-subtle)] text-[var(--color-content-secondary)] text-xs">
          {leaves.map((leave) => {
            const initials = (leave.employeeName || "Employee")
              .split(" ")
              .filter(Boolean)
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() || "??";

            const rawStatus = String(leave.status || "Pending").toUpperCase();

            // Resolve title-case leave type robustly from backend keys.
            // Backend currently sends: { type: "Annual Leave" | ... , typeUpper: "ANNUAL" | "SICK" | "CASUAL" }
            const resolvedType = resolveLeaveTypeTitle(leave as LeaveRequest);

            return (
              <tr key={leave.id} className="table-row-hover">
                {/* Employee Column (Name & Avatar) */}
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--color-surface-main)] text-[var(--color-content-secondary)] border border-[var(--color-line-subtle)] flex items-center justify-center font-bold text-[11px]">
                      {initials}
                    </div>
                    <div>
                      <span className="font-bold text-[var(--color-content-main)] block leading-tight capitalize">
                        {leave.employeeName}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Designation Column */}
                <td className="table-cell">
                  <span className="text-[var(--color-content-secondary)] font-medium capitalize">
                    {leave.designation || "No Designation Specified"}
                  </span>
                </td>

                {/* Leave Type Column */}
                <td className="table-cell">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide uppercase border ${getLeaveTypeStyles(resolvedType)}`}>
                    {leave.type}
                  </span>
                </td>

                {/* Duration & Dates Column */}
                <td className="table-cell">
                  <div className="flex flex-col">
                    <span className="font-bold text-[var(--color-content-main)] flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[var(--color-content-muted)]" />
                      {leave.days || 0} {leave.days === 1 ? "day" : "days"}
                    </span>
                    <span className="text-[10px] text-[var(--color-content-muted)] mt-1">
                      {leave.startDate || "N/A"} to {leave.endDate || "N/A"}
                    </span>
                  </div>
                </td>

                {/* Reason Column */}
                <td className="table-cell max-w-xs">
                  <button
                    onClick={() => onSelect(leave)}
                    className="flex items-start gap-1.5 text-[var(--color-content-secondary)] text-left hover:text-[var(--color-brand-accent)] group transition duration-150"
                    title="Click to view full details"
                  >
                    <FileText className="w-4 h-4 text-[var(--color-content-muted)] group-hover:text-[var(--color-brand-accent)]/80 flex-shrink-0 mt-0.5" />
                    <span className="truncate block font-medium underline decoration-dotted underline-offset-2">
                      {leave.reason || "No reason provided"}
                    </span>
                  </button>
                </td>

                {/* Status Column */}
                <td className="table-cell text-center">
                  <div className="inline-flex items-center justify-center">
                    <span className={`status-pill ${getStatusBadgeStyles(leave.status)}`}>
                      {rawStatus === "APPROVED" && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                      {rawStatus === "REJECTED" && <XCircle className="w-3 h-3 text-rose-500" />}
                      {rawStatus === "PENDING" && <Clock className="w-3 h-3 text-amber-500" />}
                      {leave.status || "Pending"}
                    </span>
                  </div>
                </td>

                {/* Actions Column */}
                <td className="table-cell text-right">
                  <button
                    onClick={() => onSelect(leave)}
                    className="p-1.5 rounded-lg text-[var(--color-brand-accent)] hover:text-[var(--color-brand-hover)] hover:bg-[var(--color-brand-subtle)] border border-transparent hover:border-[var(--color-brand-accent)]/20 transition inline-flex items-center gap-1 ml-auto cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span className="text-[10px] font-bold">Review</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};