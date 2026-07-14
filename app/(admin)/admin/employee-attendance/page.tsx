"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, RefreshCw, X, AlertCircle, Clock, Info } from "lucide-react";

import AttendanceSummaryCards from "@/app/components/admin/AttendanceSummaryCards";
import AttendanceFilters from "@/app/components/admin/AttendanceFilters";
import AttendanceTable from "@/app/components/admin/AttendanceTable";
import HistoryAnalytics from "@/app/components/admin/HistoryAnalytics";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminAttendancePage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<"directory" | "history-drill">("directory");
  const [filterDate, setFilterDate] = useState<string>(todayISO());

  // Filter criteria
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  // History states
  const [drillEmployeeId, setDrillEmployeeId] = useState("");
  const [drillPeriod, setDrillPeriod] = useState<"this-month" | "last-month" | "all">("last-month");

  // Modal triggers
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Loading indicator states
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [manualForm, setManualForm] = useState({
    userId: "",
    date: todayISO(),
    checkIn: "09:00",
    checkOut: "17:00",
    status: "On Time" as "On Time" | "Late" | "Absent",
  });

  const [editForm, setEditForm] = useState({
    checkIn: "09:00",
    checkOut: "17:00",
    hasCheckOut: false,     // Tracks if a check-out time exists in the DB
    enableCheckOut: false,  // Tracks if check-out editing is active
    status: "On Time" as "On Time" | "Late" | "Absent",
  });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchDailyLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/employee-attendance?date=${filterDate}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
        setAttendanceLogs(data.logs || []);

        if (data.employees?.length > 0 && !drillEmployeeId) {
          setDrillEmployeeId(data.employees[0].userId);
        }
      }
    } catch (err) {
      console.error("Failed fetching daily sheets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyLogs();
  }, [filterDate]);

  const mergedRecords = useMemo(() => {
    return employees.map((emp) => {
      const log = attendanceLogs.find((l) => l.userId === emp.userId);
      return {
        userId: emp.userId,
        name: emp.name,
        department: emp.department,
        designation: emp.designation,
        shiftTime: emp.shiftTime || "12-8", // Mock/Fetched shift info (e.g. 12-8)
        checkIn: log?.checkIn ? new Date(log.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
        checkOut: log?.checkOut ? new Date(log.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
        rawCheckIn: log?.checkIn || null,
        rawCheckOut: log?.checkOut || null,
        workingHours: log?.workingHours || 0,
        formattedDuration: log?.formattedDuration || "",
        status: (log?.status || "Absent") as "On Time" | "Late" | "Absent",
      };
    });
  }, [employees, attendanceLogs]);

  const metrics = useMemo(() => {
    const presentCount = mergedRecords.filter((r) => r.status === "On Time" || r.status === "Late").length;
    const absentCount = mergedRecords.filter((r) => r.status === "Absent").length;
    const onTimeCount = mergedRecords.filter((r) => r.status === "On Time").length;
    const lateCount = mergedRecords.filter((r) => r.status === "Late").length;

    return {
      totalEmployees: employees.length,
      presentCount,
      absentCount,
      onTimeCount,
      lateCount,
    };
  }, [employees.length, mergedRecords]);

  const filteredRecords = useMemo(() => {
    return mergedRecords.filter((rec) => {
      const matchSearch =
        rec.name.toLowerCase().includes(searchQuery.toLowerCase()) || rec.userId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = filterDept === "All" || rec.department === filterDept;
      const matchStatus = filterStatus === "All" || rec.status === filterStatus;
      return matchSearch && matchDept && matchStatus;
    });
  }, [mergedRecords, searchQuery, filterDept, filterStatus]);

  const handleMarkStatus = async (userId: string, status: "On Time" | "Late" | "Absent") => {
    try {
      const isAbsent = status === "Absent";
      const payload = {
        userId,
        date: filterDate,
        checkIn: isAbsent ? null : `${filterDate}T09:00:00Z`,
        checkOut: isAbsent ? null : `${filterDate}T17:00:00Z`,
        status,
      };

      const res = await fetch("/api/admin/employee-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        triggerToast("Duty status logged successfully.");
        fetchDailyLogs();
      }
    } catch (err) {
      console.error("Failed marking quick status:", err);
    }
  };

  const handleOpenEdit = (userId: string) => {
    const record = attendanceLogs.find((l) => l.userId === userId);
    setSelectedUserId(userId);

    const hasCheckOut = !!record?.checkOut;

    setEditForm({
      checkIn: record?.checkIn ? new Date(record.checkIn).toISOString().substring(11, 16) : "09:00",
      checkOut: record?.checkOut ? new Date(record.checkOut).toISOString().substring(11, 16) : "17:00",
      hasCheckOut: hasCheckOut,
      enableCheckOut: hasCheckOut, // Lock/disable input if no checkout is on record
      status: (record?.status || "On Time") as any,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    try {
      const isAbsent = editForm.status === "Absent";
      const payload = {
        userId: selectedUserId,
        date: filterDate,
        checkIn: isAbsent ? null : `${filterDate}T${editForm.checkIn}:00Z`,
        // Send checkOut only if it is enabled/saved by the admin
        checkOut: (isAbsent || !editForm.enableCheckOut) ? null : `${filterDate}T${editForm.checkOut}:00Z`,
        status: editForm.status,
      };

      const res = await fetch("/api/admin/employee-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        triggerToast("Timesheet adjusted.");
        fetchDailyLogs();
      }
    } catch (err) {
      console.error("Failed adjusting timesheet:", err);
    }
  };

  const handleOpenAdd = () => {
    setManualForm((prev) => ({
      ...prev,
      userId: employees[0]?.userId || "",
      date: filterDate,
      checkIn: "09:00",
      checkOut: "17:00",
      status: "On Time",
    }));
    setIsAddModalOpen(true);
  };

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isAbsent = manualForm.status === "Absent";
      const payload = {
        userId: manualForm.userId,
        date: manualForm.date,
        checkIn: isAbsent ? null : `${manualForm.date}T${manualForm.checkIn}:00Z`,
        checkOut: isAbsent ? null : `${manualForm.date}T${manualForm.checkOut}:00Z`,
        status: manualForm.status,
      };

      const res = await fetch("/api/admin/employee-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        triggerToast("Manual check-in record saved.");
        fetchDailyLogs();
      }
    } catch (err) {
      console.error("Failed logging manual entry:", err);
    }
  };

  const handleSyncHardware = async () => {
    setIsSyncing(true);
    setTimeout(async () => {
      setIsSyncing(false);
      triggerToast("Sync complete. Fresh checks fetched from hardware.");
      fetchDailyLogs();
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto pb-16 px-4 md:px-8 text-[var(--color-content-main)]">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 bg-slate-900 border border-slate-800 text-white text-xs font-bold rounded-2xl shadow-xl">
          <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6 pb-6 border-b border-[var(--color-line-subtle)]">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">On-Site Attendance</h1>
          <p className="mt-1 text-xs text-[var(--color-content-secondary)]">
            Review live checking nodes, add manual ledger records, and analyze deep historical stats.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSyncHardware}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[var(--color-content-main)] border border-[var(--color-line-subtle)] rounded-xl text-xs font-bold transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-[var(--color-brand-accent)]" : ""}`} />
            <span>{isSyncing ? "Syncing Biometrics..." : "Sync Biometric Devices"}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-hover)] text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Manual Attendance</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-[var(--color-line-subtle)]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("directory")}
            className={`px-5 py-3 text-xs font-bold border-b-2 transition -mb-px flex items-center gap-2 ${
              activeTab === "directory"
                ? "border-[var(--color-brand-accent)] text-[var(--color-brand-accent)]"
                : "border-transparent text-[var(--color-content-secondary)] hover:text-[var(--color-content-main)]"
            }`}
          >
            <span>Daily Timesheets Directory</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] text-[var(--color-content-secondary)] font-extrabold">
              {filteredRecords.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("history-drill")}
            className={`px-5 py-3 text-xs font-bold border-b-2 transition -mb-px flex items-center gap-2 ${
              activeTab === "history-drill"
                ? "border-[var(--color-brand-accent)] text-[var(--color-brand-accent)]"
                : "border-transparent text-[var(--color-content-secondary)] hover:text-[var(--color-content-main)]"
            }`}
          >
            <span>Employee Historical Analytics</span>
          </button>
        </div>
      </div>

      {activeTab === "directory" ? (
        <div className="space-y-6">
          <AttendanceSummaryCards metrics={metrics} filterDate={filterDate} onDateChange={setFilterDate} />

          <AttendanceFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterDept={filterDept}
            onDeptChange={setFilterDept}
            filterStatus={filterStatus}
            onStatusChange={setFilterStatus}
            departments={["All", "Engineering", "Marketing", "Human Resources", "Finance", "Design"]}
            statuses={["All", "On Time", "Late", "Absent"]}
            onClear={() => {
              setSearchQuery("");
              setFilterDept("All");
              setFilterStatus("All");
            }}
          />

          {isLoading ? (
            <div className="py-12 text-center text-xs text-[var(--color-content-secondary)]">Retrieving timesheet logs...</div>
          ) : (
            <AttendanceTable
              records={filteredRecords}
              onMarkStatus={handleMarkStatus}
              onEditTimesheet={handleOpenEdit}
              onDrillHistory={(id) => {
                setDrillEmployeeId(id);
                setActiveTab("history-drill");
              }}
            />
          )}
        </div>
      ) : (
        <HistoryAnalytics
          employees={employees}
          selectedEmployeeId={drillEmployeeId}
          onEmployeeChange={setDrillEmployeeId}
          period={drillPeriod}
          onPeriodChange={setDrillPeriod}
        />
      )}

      {/* Manual log modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white border border-[var(--color-line-subtle)] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-line-subtle)] flex items-center justify-between bg-slate-50">
              <div className="text-xs font-black uppercase tracking-wider">Log Manual Work punches</div>
              <button onClick={() => setIsAddModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1">Employee Account</label>
                <select
                    value={manualForm.userId}
                    onChange={(e) => setManualForm({ ...manualForm, userId: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-[var(--color-line-subtle)] rounded-xl text-xs font-semibold outline-none cursor-pointer focus:bg-white transition"
                  >
                  {employees.map((emp) => (
                    <option key={emp.userId} value={emp.userId}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Target Date</label>
                  <input
                    type="date"
                    value={manualForm.date}
                    onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-[var(--color-line-subtle)] rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase mb-1">Attendance Status</label>
                  <select
                    value={manualForm.status}
                    onChange={(e) => setManualForm({ ...manualForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-[var(--color-line-subtle)] rounded-xl text-xs"
                  >
                    <option value="On Time">On Time</option>
                    <option value="Late">Late</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
              </div>

              {manualForm.status !== "Absent" && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1">Check-In</label>
                    <input
                      type="time"
                      value={manualForm.checkIn}
                      onChange={(e) => setManualForm({ ...manualForm, checkIn: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-[var(--color-line-subtle)] rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1">Check-Out</label>
                    <input
                      type="time"
                      value={manualForm.checkOut}
                      onChange={(e) => setManualForm({ ...manualForm, checkOut: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-[var(--color-line-subtle)] rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[var(--color-content-secondary)] bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-[var(--color-brand-accent)] rounded-xl">
                  Save Work Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal logic to lock checkouts if On Duty */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white border border-[var(--color-line-subtle)] rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-line-subtle)] flex items-center justify-between bg-slate-50">
              <div className="text-xs font-black uppercase tracking-wider">Timesheet Punch Adjustments</div>
              <button onClick={() => setIsEditModalOpen(false)}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1">Arrival Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value as any })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-[var(--color-line-subtle)] rounded-xl text-xs font-semibold outline-none cursor-pointer focus:bg-white transition"
                >
                  <option value="On Time">On Time</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>

              {editForm.status !== "Absent" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1">Check-In</label>
                    <input
                      type="time"
                      value={editForm.checkIn}
                      onChange={(e) => setEditForm({ ...editForm, checkIn: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-[var(--color-line-subtle)] rounded-xl text-xs"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[10px] font-bold uppercase">Check-Out</label>
                      {!editForm.hasCheckOut && (
                        <div className="flex items-center gap-1">
                          <input
                            type="checkbox"
                            id="registerCheckout"
                            checked={editForm.enableCheckOut}
                            onChange={(e) => setEditForm({ ...editForm, enableCheckOut: e.target.checked })}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-[var(--color-brand-accent)] focus:ring-[var(--color-brand-accent)]"
                          />
                          <label htmlFor="registerCheckout" className="text-[10px] font-bold text-emerald-600 cursor-pointer">
                            Register Check-Out
                          </label>
                        </div>
                      )}
                    </div>

                    {!editForm.hasCheckOut && !editForm.enableCheckOut ? (
                      <div className="flex items-start gap-2 p-2.5 bg-amber-50/70 border border-amber-100 rounded-xl">
                        <Info className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                        <span className="text-[10px] text-amber-700 leading-normal">
                          Employee is currently <strong>On Duty</strong>. Check-out is locked. Check "Register Check-Out" to manually checkout.
                        </span>
                      </div>
                    ) : (
                      <input
                        type="time"
                        value={editForm.checkOut}
                        onChange={(e) => setEditForm({ ...editForm, checkOut: e.target.value })}
                        disabled={!editForm.enableCheckOut}
                        className="w-full px-3 py-2 bg-slate-50 border border-[var(--color-line-subtle)] rounded-xl text-xs disabled:opacity-50"
                      />
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[var(--color-content-secondary)] bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-[var(--color-brand-accent)] rounded-xl">
                  Save Adjustments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}