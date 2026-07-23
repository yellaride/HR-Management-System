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
  
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);

  useEffect(() => {
    async function fetchEmployeeData() {
      try {
        setLoading(true);
        setMessage(null);
        const res = await fetch("/api/employee/leaves-request");
        if (res.ok) {
          const data = await res.json();
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
      } catch {
        setMessage({ type: "error", text: "Failed to load leave records" });
      } finally {
        setLoading(false);
      }
    }
    fetchEmployeeData();
  }, []);

  const handleRowClick = (record: LeaveRecord) => {
    const mappedType: LeaveRequest["type"] =
      record.type === "ANNUAL"
        ? "Annual Leave"
        : record.type === "SICK"
          ? "Sick Leave"
          : record.type === "CASUAL"
            ? "Casual Leave"
            : "Other Leave";

    const mappedStatus: LeaveRequest["status"] =
      record.status === "APPROVED"
        ? "Approved"
        : record.status === "REJECTED"
          ? "Rejected"
          : "Pending";

    const mapped: LeaveRequest = {
      id: record.id,
      employeeName: "Your Request",
      designation: "Employee",
      department: "Internal",
      type: mappedType,
      startDate: record.startDate,
      endDate: record.endDate,
      days: record.days,
      reason: record.reason,
      status: mappedStatus,
      
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

      if (data.updatedBalances) {
        setBalances(data.updatedBalances);
      }

      setMessage({
        type: "success",
        text: `Leave request submitted successfully! ${data.newRequest?.days || ""} days requested.`,
      });

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
          } catch {
            // Retain last known state on refresh error
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
    <div className="space-y-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-line-subtle">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-content-main tracking-tight">
            My Leave Dashboard
          </h1>
          <p className="mt-1 text-xs text-content-secondary leading-relaxed">
            Track allocated balances and request new leaves.
          </p>
        </div>
        <button
          onClick={() => setIsApplyModalOpen(true)}
          disabled={submitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-accent text-white rounded-xl text-xs font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Apply for Leave
        </button>
      </div>

      {/* Success/Error Alerts */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
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
                className="bg-surface-card border border-line-subtle rounded-2xl p-5 shadow-xs flex flex-col justify-between"
              >
                <h3 className="text-xs font-bold text-content-secondary uppercase tracking-widest mb-3">
                  {leaveType === "ANNUAL" ? "Annual Leave" : leaveType === "SICK" ? "Sick Leave" : "Casual Leave"}
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-content-muted font-medium">Allocated:</span>
                    <span className="font-bold text-content-main">{balance.allocated || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-content-muted font-medium">Used:</span>
                    <span className="font-bold text-amber-600">{balance.used || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-line-subtle pt-2 mt-1">
                    <span className="text-content-muted font-medium">Remaining:</span>
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
        <div className="text-center py-16 text-content-muted text-xs font-medium">
          <div className="flex justify-center items-center gap-2">
            <div className="w-4 h-4 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
            <span>Loading leave records...</span>
          </div>
        </div>
      ) : (
        <div
          onClick={(e) => {
            const row = (e.target as HTMLElement).closest("tbody tr") as HTMLTableRowElement | null;
            if (row) {
              const index = row.sectionRowIndex;
              if (index !== -1 && history[index]) {
                handleRowClick(history[index]);
              }
            }
          }}
          className="overflow-x-auto rounded-2xl bg-surface-card border border-line-subtle shadow-xs"
        >
          {history && history.length > 0 ? (
            <LeaveHistoryTable history={history} />
          ) : (
            <div className="text-center py-12 text-content-muted">
              <p className="text-xs font-medium">No leave records found.</p>
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

      {/* Read-Only Leave Details Modal */}
      {selectedLeave && (
        <LeaveDetailsModal
          leave={selectedLeave}
          onClose={() => setSelectedLeave(null)}
        />
      )}
    </div>
  );
}