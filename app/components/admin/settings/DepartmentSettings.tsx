"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Users, Plus, Trash2, Loader2, Crown, X } from "lucide-react";
import Swal from "sweetalert2";

interface DepartmentSettingsProps {
  departments: string[];
  onAdd: (name: string) => Promise<void>;
  onDelete: (name: string) => Promise<void>;
}

interface DepartmentHeadInfo {
  department: string;
  userId: string;
  name: string;
  designation: string;
}

interface EmployeeOption {
  userId: string;
  name: string;
  designation: string;
  department: string;
}

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

export default function DepartmentSettings({ departments, onAdd, onDelete }: DepartmentSettingsProps) {
  const [newDept, setNewDept] = useState("");
  const [adding, setAdding] = useState(false);

  const [heads, setHeads] = useState<DepartmentHeadInfo[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [savingDept, setSavingDept] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const refreshHeads = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/department-heads")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { heads?: DepartmentHeadInfo[]; employees?: EmployeeOption[] } | null) => {
        if (cancelled || !data) return;
        setHeads(Array.isArray(data.heads) ? data.heads : []);
        setEmployees(Array.isArray(data.employees) ? data.employees : []);
      })
      .catch((err) => console.error("Failed to load department heads:", err));

    return () => {
      cancelled = true;
    };
  }, [departments, reloadKey]);

  const handleAdd = async () => {
    const name = newDept.trim();
    if (!name) return;
    try {
      setAdding(true);
      await onAdd(name);
      setNewDept("");
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const updateHead = async (department: string, userId: string | null) => {
    try {
      setSavingDept(department);
      const res = await fetch("/api/admin/department-heads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ department, userId }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Failed to update department head.");
      }

      refreshHeads();
      Toast.fire({
        icon: "success",
        title: userId ? "Department head assigned" : "Department head removed",
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: err instanceof Error ? err.message : "Could not update department head.",
        confirmButtonColor: "#7c3aed",
      });
    } finally {
      setSavingDept(null);
    }
  };

  const handleRemoveHead = async (department: string, headName: string) => {
    const result = await Swal.fire({
      title: "Remove department head?",
      text: `${headName} will lose all ${department} management access (leave approvals, attendance).`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Remove",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
    });
    if (result.isConfirmed) {
      await updateHead(department, null);
    }
  };

  // Replacing a head is a single atomic step: the old head instantly reverts
  // to a normal employee and the new head gains full department access.
  const handleReplaceHead = async (
    department: string,
    currentHeadName: string,
    newHead: EmployeeOption
  ) => {
    const result = await Swal.fire({
      title: "Change department head?",
      html: `<b>${currentHeadName}</b> will become a normal employee again,<br/>and <b>${newHead.name}</b> will get all ${department} head access.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Change Head",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#7c3aed",
    });
    if (result.isConfirmed) {
      await updateHead(department, newHead.userId);
    }
  };

  return (
    <div className="panel bg-white border border-line-subtle rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-line-subtle">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-accent" />
          <h3 className="text-sm font-bold text-content-main">Department Management</h3>
        </div>
        {/* <span className="text-[10px] font-semibold text-content-secondary bg-surface-subtle border border-line-subtle px-2 py-1 rounded-lg">
          Heads can approve leaves &amp; manage attendance for their department only
        </span> */}
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter department name (e.g., Engineering)"
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            className="form-input text-xs flex-1 p-2 border border-line-subtle rounded-lg outline-none"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={adding || !newDept.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-brand-accent hover:bg-brand-hover disabled:opacity-50 text-white text-xs font-bold rounded-lg transition cursor-pointer"
          >
            {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Add</span>
          </button>
        </div>

        {departments.length === 0 ? (
          <p className="text-xs text-content-secondary italic">No departments configured.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {departments.map((dept) => {
              const head = heads.find((h) => h.department === dept);
              const deptEmployees = employees.filter((e) => e.department === dept);
              const isSaving = savingDept === dept;

              return (
                <div
                  key={dept}
                  className="bg-white border border-line-subtle rounded-xl text-xs shadow-xs hover:shadow-sm transition-shadow overflow-hidden"
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 bg-surface-subtle border-b border-line-subtle">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-7 rounded-lg bg-brand-subtle flex items-center justify-center shrink-0">
                        <Users className="w-3.5 h-3.5 text-brand-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-content-main truncate leading-tight">{dept}</p>
                        <p className="text-[10px] text-content-secondary leading-tight">
                          {deptEmployees.length} member{deptEmployees.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDelete(dept)}
                      title="Delete department"
                      className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Head section */}
                  <div className="p-3.5 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wide text-content-secondary">
                        Department Head
                      </span>
                    </div>

                    {head ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 bg-amber-50/60 border border-amber-200 rounded-xl px-2.5 py-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="size-8 rounded-full bg-amber-500 flex items-center justify-center font-bold text-white text-[11px] shrink-0 shadow-xs">
                              {head.name
                                .split(" ")
                                .map((part) => part.charAt(0))
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-content-main truncate leading-tight">{head.name}</p>
                              <p className="text-[10px] text-content-secondary truncate leading-tight">
                                {head.designation || "Team member"}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveHead(dept, head.name)}
                            disabled={isSaving}
                            title="Remove head"
                            className="p-1.5 hover:bg-red-100 text-amber-600/60 hover:text-red-500 rounded-lg transition cursor-pointer shrink-0"
                          >
                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        {deptEmployees.some((e) => e.userId !== head.userId) && (
                          <select
                            value=""
                            disabled={isSaving}
                            onChange={(e) => {
                              const newHead = deptEmployees.find((emp) => emp.userId === e.target.value);
                              if (newHead) {
                                handleReplaceHead(dept, head.name, newHead);
                              }
                            }}
                            className="form-input text-[11px] w-full p-2 border border-line-subtle rounded-lg outline-none bg-surface-subtle text-content-secondary hover:text-content-main cursor-pointer transition disabled:opacity-50"
                          >
                            <option value="" disabled>
                              {isSaving ? "Updating..." : "↺ Change head..."}
                            </option>
                            {deptEmployees
                              .filter((emp) => emp.userId !== head.userId)
                              .map((emp) => (
                                <option key={emp.userId} value={emp.userId}>
                                  {emp.name}
                                  {emp.designation ? ` — ${emp.designation}` : ""}
                                </option>
                              ))}
                          </select>
                        )}
                      </div>
                    ) : deptEmployees.length === 0 ? (
                      <div className="flex items-center gap-2 bg-surface-subtle border border-dashed border-line-subtle rounded-xl px-2.5 py-2.5">
                        <p className="text-[11px] text-content-secondary italic">
                          Add employees to this department first.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <select
                          defaultValue=""
                          disabled={isSaving}
                          onChange={(e) => {
                            const userId = e.target.value;
                            if (userId) {
                              updateHead(dept, userId);
                              e.target.value = "";
                            }
                          }}
                          className="form-input text-xs flex-1 p-2 border border-line-subtle rounded-lg outline-none bg-white cursor-pointer disabled:opacity-50"
                        >
                          <option value="" disabled>
                            {isSaving ? "Assigning..." : "Assign a head..."}
                          </option>
                          {deptEmployees.map((emp) => (
                            <option key={emp.userId} value={emp.userId}>
                              {emp.name}
                              {emp.designation ? ` — ${emp.designation}` : ""}
                            </option>
                          ))}
                        </select>
                        {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-accent shrink-0" />}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
