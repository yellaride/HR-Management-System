"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Plus } from "lucide-react";
import LeaveHistoryTable, { LeaveRecord } from "@/app/components/employee/LeaveHistoryTable";
import { LeaveDetailsModal } from "@/app/components/admin/leaves/LeaveDetailsModal";
import ApplyLeaveModal from "@/app/components/employee/ApplyLeaveModal";
import { LeaveRequest, LeaveBalances } from "@/lib/types";

export default function EmployeeLeavesPage() {
  const [history, setHistory] = useState<LeaveRecord[]>([]);
  const [balances, setBalances] = useState<LeaveBalances | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Selected leave for viewing detail modal
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);

  useEffect(() => {
    async function fetchEmployeeData() {
      try {
        setLoading(true);
        setMessage(null);
        // GET retrieves this employee's leaves and balances
        const res = await fetch("/api/employee/leaves-request");
        if (res.ok) {
          const data = await res.json();
          // Expected response: { leaves: [...], balances: {...} }
          if (data.leaves && data.balances) {
            setHistory(data.leaves);
            setBalances(data.balances);
          } else if (Array.isArray(data)) {
            setHistory(data);
          } else {
            setHistory([]);
          }
        } else {
          const errorData = await res.json().catch(() => ({}));
          setMessage({ type: "error", text: errorData.error || "Failed to load leave records" });
        }
      } catch (err) {
        setMessage({ type: "error", text: "Failed to load leave records" });
      } finally {
        setLoading(false);
      }
    }
    fetchEmployeeData();
  }, []);

  const handleRowClick = (record: LeaveRecord) => {
    // Map LeaveRecord to LeaveRequest structure required by LeaveDetailsModal
    const mappedType: LeaveRequest["type"] =
      record.type === "ANNUAL"
        ? "Annual Leave"
        : record.type === "SICK"
          ? "Sick Leave"
          : record.type === "CASUAL"
            ? "Casual Leave"
            : "Other Leave";

    // Map the uppercase status to title-case status
    const mappedStatus: LeaveRequest["status"] =
      record.status === "APPROVED"
        ? "Approved"
        : record.status === "REJECTED"
          ? "Rejected"
          : "Pending";

    const mapped: LeaveRequest = {
      id: record.id,
      employeeName: "Your Request",
      // Restored both fields to ensure the mapped object satisfies type definitions
      designation: "Employee",
      department: "Internal",
      type: mappedType,
      startDate: record.startDate,
      endDate: record.endDate,
      days: record.days,
      reason: record.reason,
      status: mappedStatus,
      
      // Cast the index key to prevent indexing errors
      totalLeaves: balances?.[record.type as keyof LeaveBalances]?.allocated || 0,
      usedLeaves: balances?.[record.type as keyof LeaveBalances]?.used || 0,
      remainingLeaves: balances?.[record.type as keyof LeaveBalances]?.remaining || 0
    };
    setSelectedLeave(mapped);
  };

  const handleApplyLeave = async (formData: {
    type: "ANNUAL" | "SICK" | "CASUAL";
    startDate: string;
    endDate: string;
    reason: string;
  }) => {
    try {
      setSubmitting(true);
      setMessage(null);

      const res = await fetch("/api/employee/leaves-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit leave request");
      }

      // Update balances after successful submission
      if (data.updatedBalances) {
        setBalances(data.updatedBalances);
      }

      setMessage({
        type: "success",
        text: `Leave request submitted successfully! ${data.newRequest?.days || ""} days requested.`,
      });

      // Refresh history
      setTimeout(() => {
        const fetchUpdated = async () => {
          try {
            const historyRes = await fetch("/api/employee/leaves-request");
            if (historyRes.ok) {
              const historyData = await historyRes.json();
              if (historyData.leaves && historyData.balances) {
                setHistory(historyData.leaves);
                setBalances(historyData.balances);
              } else if (Array.isArray(historyData)) {
                setHistory(historyData);
              }
            }
          } catch (err) {
            // Swallow refresh errors; UI shows the last known state.
          }
        };
        fetchUpdated();
        setIsApplyModalOpen(false);
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit leave request";
      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6  w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-[var(--color-content-main)]">My Leave Dashboard</h1>
          <p className="text-xs text-[var(--color-content-muted)]">Track and request your leaves.</p>
        </div>
        <button
          onClick={() => setIsApplyModalOpen(true)}
          disabled={submitting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-brand-accent)] text-white rounded-lg text-xs font-bold hover:bg-[var(--color-brand-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Apply for Leave
        </button>
      </div>

      {/* Success/Error Messages */}
      {message && (
        <div
          className={`p-4 rounded-lg text-xs font-medium flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
              : "bg-rose-50 text-rose-700 border border-rose-100"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Leave Balance Cards */}
       {balances && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {(["ANNUAL", "SICK", "CASUAL"] as const).map((leaveType) => {
            const balance = balances[leaveType];
            return (
              <div
                key={leaveType}
                className="bg-[var(--color-surface-card)] border border-[var(--color-line-subtle)] rounded-xl p-4 shadow-sm"
              >
                <h3 className="text-xs font-bold text-[var(--color-content-secondary)] uppercase tracking-widest mb-3">
                  {leaveType === "ANNUAL" ? "Annual Leave" : leaveType === "SICK" ? "Sick Leave" : "Casual Leave"}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--color-content-muted)]">Allocated:</span>
                    <span className="font-bold text-[var(--color-content-main)]">{balance.allocated || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--color-content-muted)]">Used:</span>
                    <span className="font-bold text-amber-600">{balance.used || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-[var(--color-line-subtle)] pt-2">
                    <span className="text-[var(--color-content-muted)]">Remaining:</span>
                    <span className="font-bold text-emerald-600">{balance.remaining || 0}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Leave History Section */}
      {loading ? (
        <div className="text-center py-12 text-[var(--color-content-muted)]">
          <div className="flex justify-center items-center gap-2">
            <div className="w-4 h-4 border-2 border-[var(--color-brand-accent)] border-t-transparent rounded-full animate-spin" />
            <span>Loading details...</span>
          </div>
        </div>
      ) : (
        <div
          onClick={(e) => {
            // Find row within target tbody only to prevent capturing the header rows
            const row = (e.target as HTMLElement).closest("tbody tr") as HTMLTableRowElement | null;
            if (row) {
              const index = row.sectionRowIndex;
              if (index !== -1 && history[index]) {
                handleRowClick(history[index]);
              }
            }
          }}
          className="overflow-x-auto vertical-slider-reset"
        >
          {history && history.length > 0 ? (
            <LeaveHistoryTable history={history} />
          ) : (
            <div className="text-center py-12 text-[var(--color-content-muted)] bg-[var(--color-surface-card)] border border-[var(--color-line-subtle)] rounded-xl">
              <p className="text-xs">No leave records found.</p>
            </div>
          )}
        </div>
      )}

      {/* Apply Leave Modal */}
      <ApplyLeaveModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        onSubmit={handleApplyLeave}
      />

      {/* Render the details modal as READ-ONLY */}
      {selectedLeave && (
        <LeaveDetailsModal
          leave={selectedLeave}
          onClose={() => setSelectedLeave(null)}
        />
      )}
    </div>
  );
}