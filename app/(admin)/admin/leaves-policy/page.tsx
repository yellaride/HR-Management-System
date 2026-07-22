"use client";

import React, { useState, useEffect } from "react";
import { Users, Edit2, RotateCcw, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import ManageLeavePolicyModal from "@/app/components/admin/leave-policy/ManageLeavePolicyModal";

interface EmployeePolicy {
  userId: string;
  name: string;
  email: string;
  profilePhotoUrl?: string;
  designation?: string;
  isCustom: boolean;
  policy: {
    ANNUAL: number;
    SICK: number;
    CASUAL: number;
    MONTHLY: number;
  };
}

export default function AdminLeavesPolicyPage() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeePolicy[]>([]);
  const [banner, setBanner] = useState<{ status: "success" | "error"; message: string } | null>(null);

  // Modal Control States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePolicy | null>(null);

  const showBanner = (status: "success" | "error", message: string) => {
    setBanner({ status, message });
    setTimeout(() => setBanner(null), 8000);
  };

  // Load baseline employee list on mount
  useEffect(() => {
    async function loadInitialData() {
      try {
        setInitialLoading(true);
        const empRes = await fetch("/api/admin/leaves-policy");
        const empData = await empRes.json().catch(() => ({}));

        if (empRes.ok) {
          setEmployees(empData);
        } else {
          const errorMsg = empData.error || empData.details || "Could not fetch configurations.";
          showBanner("error", errorMsg);
        }
      } catch (err) {
        console.error("Failed to load list.", err);
        showBanner("error", "Network issue encountered while loading configurations.");
      } finally {
        setInitialLoading(false);
      }
    }
    loadInitialData();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (emp: EmployeePolicy) => {
    setSelectedEmployee(emp);
    setIsModalOpen(true);
  };

  // Reusable API Save Handler passed directly into our modal
  const handleSavePolicy = async (
    userId: string,
    policyData: { ANNUAL: number; SICK: number; CASUAL: number; MONTHLY: number }
  ) => {
    const res = await fetch("/api/admin/leaves-policy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...policyData }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.details || "Failed to customize employee configuration.");
    }

    const updatedEmployees = employees.map((item) =>
      item.userId === userId
        ? {
            ...item,
            isCustom: true,
            policy: { ...policyData },
          }
        : item
    );
    setEmployees(updatedEmployees);
  };

  // Inline Soft Revert to System Baseline Confirmation
  const handleResetToDefault = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to revert ${name} to standard parameters?`)) return;

    try {
      const res = await fetch(`/api/admin/leaves-policy?userId=${userId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showBanner("success", `Reverted ${name}'s parameters back to standard baseline.`);

        const resetEmployees = employees.map((item) =>
          item.userId === userId
            ? {
                ...item,
                isCustom: false,
                policy: { ANNUAL: 15, SICK: 8, CASUAL: 6, MONTHLY: 2 },
              }
            : item
        );
        setEmployees(resetEmployees);
      } else {
        showBanner("error", data.error || data.details || "Failed to revert user parameters.");
      }
    } catch (err) {
      console.error(err);
      showBanner("error", "Error resetting employee parameters.");
    }
  };

  const customOverrideEmployees = employees.filter((emp) => emp.isCustom);
  const standardBaselineCount = employees.length - customOverrideEmployees.length;

  return (
    <div className="space-y-6 min-h-screen pb-12">
      {/* Header Info */}
      <div className="pb-6 border-b border-line-subtle flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-content-main tracking-tight font-sans">
            Manage Overrides Leaves Policy
          </h1>
          <p className="text-xs text-content-muted mt-1 font-medium">
            Configure, manage, and customize leave policies for individual profiles.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="self-start inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-accent hover:bg-brand-hover transition cursor-pointer"
        >
          Create Policy Override
        </button>
      </div>

      {/* Main Banner Message */}
      {banner && (
        <div
          className={`flex items-start gap-2.5 p-4 rounded-xl text-xs font-semibold border transition-all ${
            banner.status === "success"
              ? "bg-emerald-50 border-emerald-100 text-emerald-800"
              : "bg-rose-50 border-rose-100 text-rose-800"
          }`}
        >
          {banner.status === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <span className="block font-bold font-sans">
              {banner.status === "success" ? "Operation Successful" : "Notification"}
            </span>
            <span className="block mt-0.5 font-medium leading-relaxed font-sans">{banner.message}</span>
          </div>
        </div>
      )}

      {/* Stats Summary Grid for Large Screens */}
      {!initialLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="panel panel-section flex items-center justify-between">
            <div>
              <p className="field-label">Total Staff Monitored</p>
              <h3 className="text-xl font-extrabold mt-1 text-content-main">{employees.length}</h3>
            </div>
            <div className="p-2.5 bg-gray-100 rounded-xl text-gray-500">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="panel panel-section flex items-center justify-between">
            <div>
              <p className="field-label">Active Overrides</p>
              <h3 className="text-xl font-extrabold mt-1 text-brand-accent">
                {customOverrideEmployees.length}
              </h3>
            </div>
            <div className="p-2.5 bg-brand-subtle rounded-xl text-brand-accent">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>

          <div className="panel panel-section flex items-center justify-between">
            <div>
              <p className="field-label font-bold">Standard Baseline Users</p>
              <h3 className="text-xl font-extrabold mt-1 text-emerald-700">{standardBaselineCount}</h3>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <RotateCcw className="w-4.5 h-4.5" />
            </div>
          </div>
        </div>
      )}

      {initialLoading ? (
        <div className="text-center py-12 text-xs text-content-muted font-semibold">
          Loading active configurations...
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-extrabold text-content-main uppercase tracking-wider">
                Active Custom Overrides
              </h2>
              <p className="text-[10px] text-content-muted font-medium mt-0.5">
                Profiles utilizing custom leave configurations.
              </p>
            </div>
          </div>

          {/* Table Container utilizing 'table-card' utility */}
          <div className="table-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="table-head">
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500">Custom Employee</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 text-center">Status</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 text-center">Annual Leave</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 text-center">Sick Leave</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 text-center">Casual Leave</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 text-center">Monthly Limit</th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 text-center hidden md:table-cell">
                      Total Annual Pool
                    </th>
                    <th className="px-6 py-3.5 text-xs font-bold text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e0e8]/60 font-medium">
                  {customOverrideEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-xs text-gray-400 font-medium">
                        <div className="max-w-xs mx-auto space-y-1.5">
                          <span className="block font-bold text-[#181124]">
                            No Active Overrides Found
                          </span>
                          <span className="block text-[10px] leading-relaxed">
                            All employees are utilizing standard baseline configurations.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    customOverrideEmployees.map((emp) => {
                      const totalPool = emp.policy.ANNUAL + emp.policy.SICK + emp.policy.CASUAL;

                      return (
                        <tr
                          key={emp.userId}
                          className="table-row-hover transition duration-150"
                        >
                          {/* Name & Contact */}
                          <td className="table-cell">
                            <div className="flex items-center gap-3">
                              {/* Profile photo (optional) */}
                              <div className="w-9 h-9 rounded-xl bg-surface-main text-content-secondary border border-line-subtle flex items-center justify-center overflow-hidden shrink-0 relative">
                                {emp.name
                                  ? emp.name
                                      .split(" ")
                                      .filter(Boolean)
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2)
                                      .toUpperCase()
                                  : "??"}
                                {emp.profilePhotoUrl ? (
                                  <img
                                    src={emp.profilePhotoUrl}
                                    alt={emp.name}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                ) : null}
                              </div>
                              <div>
                                <div className="font-bold text-xs text-[#181124] capitalize">{emp.name}</div>
                                <div className="text-[10px] text-gray-400 mt-0.5">{emp.email}</div>
                                {/* Designation if available */}
                                {emp.designation && (
                                  <div className="text-[10px] text-gray-500 mt-0.5">{emp.designation}</div>
                                )}
                              </div>
                            </div>
                          </td>


                          {/* Custom Override Indicator Badge */}
                          <td className="table-cell text-center">
                            <span className="status-pill bg-brand-subtle text-brand-accent border-brand-accent/20">
                              Custom
                            </span>
                          </td>

                          {/* Annual Leave Limit */}
                          <td className="table-cell text-center">
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-purple-50 text-purple-700 font-mono font-bold text-[11px] border border-purple-100 min-w-[54px]">
                              {emp.policy.ANNUAL} d
                            </span>
                          </td>

                          {/* Sick Leave Limit */}
                          <td className="table-cell text-center">
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold text-[11px] border border-blue-100 min-w-[54px]">
                              {emp.policy.SICK} d
                            </span>
                          </td>

                          {/* Casual Leave Limit */}
                          <td className="table-cell text-center">
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-amber-50 text-amber-700 font-mono font-bold text-[11px] border border-amber-100 min-w-[54px]">
                              {emp.policy.CASUAL} d
                            </span>
                          </td>

                          {/* Monthly Leave Limit */}
                          <td className="table-cell text-center">
                            <span className="inline-flex items-center justify-center px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-mono font-bold text-[11px] border border-emerald-100 min-w-[54px]">
                              {emp.policy.MONTHLY ?? 2} d
                            </span>
                          </td>

                          {/* Computed Annual Sum Column (Hidden on mobile) */}
                          <td className="table-cell text-center font-mono font-bold text-xs text-content-main hidden md:table-cell">
                            <div className="text-xs font-extrabold text-content-main">{totalPool} Days</div>
                            <div className="text-[9px] text-content-muted font-medium">Accumulative</div>
                          </td>

                          {/* Action Buttons */}
                          <td className="table-cell text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              {/* Edit Action Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(emp)}
                                className="p-1.5 rounded-xl icon-button hover:text-brand-accent hover:border-brand-accent/35 hover:bg-brand-subtle"
                                title="Edit override settings"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Override Action Button */}
                              <button
                                type="button"
                                onClick={() => handleResetToDefault(emp.userId, emp.name)}
                                className="p-1.5 rounded-xl icon-button hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50"
                                title="Revert limits back to default"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
      )}

      {/* Custom Configured Modal */}
      <ManageLeavePolicyModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEmployee(null);
        }}
        employees={employees}
        selectedEmployee={selectedEmployee}
        onSave={handleSavePolicy}
      />
    </div>
  );
}