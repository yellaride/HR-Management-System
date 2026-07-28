"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { AlertCircle } from "lucide-react";

import { LeaveRequest } from "@/lib/types";
import { LeaveHeader } from "@/app/components/admin/leaves/LeaveHeader";
import { LeaveFilters } from "@/app/components/admin/leaves/LeaveFilters";
import { LeaveTable } from "@/app/components/admin/leaves/LeaveTable";
import { LeaveDetailsModal } from "@/app/components/admin/leaves/LeaveDetailsModal";

// Helper functions to map uppercase Database values to Frontend Title Case
const mapStatus = (status?: string): "Pending" | "Approved" | "Rejected" => {
  const s = String(status || "PENDING").toUpperCase();
  if (s === "APPROVED" || s === "APPROVE") return "Approved";
  if (s === "REJECTED" || s === "REJECT") return "Rejected";
  return "Pending";
};

const mapType = (
  type?: string
): "Annual Leave" | "Sick Leave" | "Casual Leave" | "Unpaid Leave" | "Other Leave" => {
  if (!type) return "Other Leave";

  // If backend already sends title-case, return it directly.
  const tTitle = String(type).trim();
  const normalizedTitle = tTitle.toLowerCase();
  if (normalizedTitle === "annual leave") return "Annual Leave";
  if (normalizedTitle === "sick leave") return "Sick Leave";
  if (normalizedTitle === "casual leave") return "Casual Leave";
  if (normalizedTitle === "unpaid leave") return "Unpaid Leave";
  if (normalizedTitle === "other leave") return "Other Leave";

  // Otherwise treat it as uppercase key (ANNUAL / SICK / CASUAL / UNPAID)
  const t = tTitle.toUpperCase();
  if (t === "ANNUAL") return "Annual Leave";
  if (t === "SICK") return "Sick Leave";
  if (t === "CASUAL") return "Casual Leave";
  if (t === "UNPAID") return "Unpaid Leave";

  return "Other Leave";
};

// Raw shape returned by /api/admin/leaves before UI normalization
interface RawLeaveRecord extends Omit<LeaveRequest, "id" | "status" | "type" | "designation" | "department"> {
  id?: string;
  _id?: string;
  status?: string;
  type?: string;
  designation?: string;
  department?: string;
}

export default function AdminLeavesPage() {
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");
  
  // Modal State
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);

  // Cached listing with background revalidation — instant on revisit
  const {
    data: rawLeaves,
    error: loadError,
    isLoading: loading,
    mutate: mutateLeaves,
  } = useSWR<RawLeaveRecord[]>("/api/admin/leaves");

  const leaves = useMemo<LeaveRequest[]>(() => {
    const rawArray = Array.isArray(rawLeaves) ? rawLeaves : [];
    return rawArray.map((item) => ({
      ...item,
      id: item.id || item._id,
      // Safe conversions of DB enums to UI formats
      status: mapStatus(item.status),
      type: mapType(item.type),
      // Ensure required UI fields exist
      designation: item.designation ?? "Internal",
      department: item.department ?? "Internal",
      // Fallback default values if the backend API does not serve balances yet
      totalLeaves: item.totalLeaves ?? 30,
      usedLeaves: item.usedLeaves ?? 12,
      remainingLeaves: item.remainingLeaves ?? 18,
    })) as LeaveRequest[];
  }, [rawLeaves]);

  const errorMsg =
    actionError ||
    (loadError
      ? loadError instanceof Error
        ? loadError.message
        : "Failed to load leave records"
      : null);

  // Optimistic decision: UI flips instantly, rolls back automatically on failure
  const decideLeave = async (id: string, action: "APPROVE" | "REJECT") => {
    setActionError(null);
    setSelectedLeave(null);

    const nextStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
    const applyStatus = (list: RawLeaveRecord[] | undefined, status: string) =>
      (list ?? []).map((item) =>
        (item.id || item._id) === id ? { ...item, status } : item
      );

    try {
      await mutateLeaves(
        async (current) => {
          const res = await fetch("/api/admin/leaves", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, action }),
          });
          if (!res.ok) throw new Error(`Failed to ${action.toLowerCase()} leave`);

          const updated = (await res.json()) as { status?: string };
          return applyStatus(current, updated.status ?? nextStatus);
        },
        {
          optimisticData: (current) => applyStatus(current, nextStatus),
          rollbackOnError: true,
          revalidate: false,
        }
      );
    } catch {
      setActionError(
        `Failed to ${action === "APPROVE" ? "approve" : "reject"} leave request. Please try again.`
      );
    }
  };

  const handleApprove = (id: string) => decideLeave(id, "APPROVE");
  const handleReject = (id: string) => decideLeave(id, "REJECT");

  // Memoized filter processing for optimized rendering
  const filteredLeaves = useMemo(() => {
    return leaves.filter((leave) => {
      if (!leave) return false;

      const employeeName = leave.employeeName || "";
      const type = leave.type || "";
      const reason = leave.reason || "";
      const search = searchQuery.toLowerCase();

      const matchesSearch =
        employeeName.toLowerCase().includes(search) ||
        type.toLowerCase().includes(search) ||
        reason.toLowerCase().includes(search);

      const matchesTab = activeTab === "All" || leave.status === activeTab;

      return matchesSearch && matchesTab;
    });
  }, [leaves, searchQuery, activeTab]);

  return (
    <div className=" space-y-6 pb-12 w-full">
      {/* Top Header & Search Area */}
      <LeaveHeader 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
      />

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Table Structure Card using Global Utilities */}
      <div className="table-card overflow-x-auto vertical-slider-reset">
        {/* Tab Controls Filter Bar */}
        <LeaveFilters 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          count={filteredLeaves.length}
          loading={loading}
        />

        {/* Content Table with internal overflow handling */}
        <LeaveTable 
          leaves={filteredLeaves} 
          loading={loading} 
          onSelect={(leave) => setSelectedLeave(leave)} 
        />
      </div>

      {/* Detail Review Modal */}
      {selectedLeave && (
        <LeaveDetailsModal 
          leave={selectedLeave} 
          onClose={() => setSelectedLeave(null)} 
          onApprove={handleApprove} 
          onReject={handleReject} 
        />
      )}
    </div>
  );
}