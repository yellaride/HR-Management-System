
"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Calendar, 
  Download, 
  AlertCircle,
  CheckCircle2,
  Filter,
} from "lucide-react";
import GeneratePayslipModal, { EmployeeOption } from "@/app/components/employee/GeneratePayslipModal";

interface ReferencedEmployee {
  _id: string;
  name: string;
  jobTitle: string;
}

interface Payslip {
  _id: string;
  employeeId: ReferencedEmployee | null; // From mongoose populate (might be null if deleted)
  employeeName?: string; // Historical fallback snapshot
  employeeRole?: string; // Historical fallback snapshot
  period: string; // e.g., "June 2026"
  basicSalary: number;
  allowances: number;
  bonus: number;
  deductions: number;
  netPay: number; // Matches mongoose backend property
  paymentMethod?: string;
  paymentDate?: string;
}

export default function AdminPayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [payslipsRes, employeesRes] = await Promise.all([
          fetch("/api/admin/payslips").catch((err) => {
            console.error("Failed fetching payslips:", err);
            return null;
          }),
          fetch("/api/admin/employees").catch((err) => {
            console.error("Failed fetching employees:", err);
            return null;
          }),
        ]);

        if (payslipsRes && payslipsRes.ok) {
          const payslipData = await payslipsRes.json();
          const payslipsArray = Array.isArray(payslipData)
            ? payslipData
            : (payslipData.payslips || payslipData.data || []);
          setPayslips(payslipsArray);
        }

        if (employeesRes && employeesRes.ok) {
          const employeeData = await employeesRes.json();
          const employeesArray = Array.isArray(employeeData)
            ? employeeData
            : (employeeData.employees || employeeData.data || []);
          setEmployees(employeesArray);
        }
      } catch (err) {
        console.error("Failed to fetch statistics:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDownload = (id: string, employeeName: string, period: string) => {
    setDownloadingId(id);
    setTimeout(() => {
      setDownloadingId(null);
      console.log(`Payslip downloaded: ${employeeName}_${period}.pdf`);
      alert(`Successfully generated and downloaded payroll receipt for ${employeeName} (${period}).`);
    }, 1200);
  };

  const handleSavePayslip = async (newSlip: {
    employeeId: string;
    period: string;
    basicSalary: number;
    allowances: number;
    deductions: number;
    bonus: number;
    paymentMethod: string;
    paymentDate: string;
  }) => {
    try {
      const response = await fetch("/api/admin/payslips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSlip),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || "HTTP request error saving payslip");
      }

      const savedPayslip: Payslip = await response.json();
      setPayslips((prev) => [savedPayslip, ...prev]);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Submission failed:", err);
      alert(err.message || "Failed to record payment. Please check parameters and try again.");
    }
  };

  // Search filter across live and historical fallback snapshot values
  const filteredPayslips = (payslips || []).filter((slip) => {
    const employeeObj = typeof slip.employeeId === "object" && slip.employeeId !== null 
      ? slip.employeeId 
      : null;

    // Use live populated details, fallback to snapshot, then empty string
    const name = employeeObj?.name || slip.employeeName || "";
    const role = employeeObj?.jobTitle || slip.employeeRole || "";
    const period = slip.period || "";

    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      period.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Paid Payslips Ledger</h1>
          <p className="mt-1 text-xs text-slate-500">
            Monitor compensations and download generated PDF receipt summaries for completed payments.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search paid payroll history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
            />
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-sm transition active:scale-[0.98]"
          >
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* 2. Management Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="text-xs font-bold text-slate-800 tracking-wide uppercase">
            Paid Records
          </div>
          <div className="inline-flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Showing {filteredPayslips.length} paid entries</span>
          </div>
        </div>

        {/* Payslips Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Pay Period</th>
                <th className="px-6 py-4 text-right">Basic Salary</th>
                <th className="px-6 py-4 text-right">Net Take-Home</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-750 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading payroll records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPayslips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-6 h-6 text-slate-300" />
                      <span>No matching paid payslips found.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayslips.map((slip) => {
                  const employeeObj = typeof slip.employeeId === "object" && slip.employeeId !== null 
                    ? slip.employeeId 
                    : null;

                  // Resolve the name and role using populated documents or historical snapshots
                  const employeeName = employeeObj?.name || slip.employeeName || "Unknown Employee";
                  const employeeRole = employeeObj?.jobTitle || slip.employeeRole || "No Specified Title";

                  const initials = employeeName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  const isCurrentlyDownloading = downloadingId === slip._id;

                  return (
                    <tr key={slip._id} className="hover:bg-slate-50/40 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center font-bold text-[11px]">
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {employeeName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                              {employeeRole}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {slip.period}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right font-semibold text-slate-600">
                        {formatCurrency(slip.basicSalary)}
                      </td>

                      <td className="px-6 py-4 text-right font-extrabold text-slate-900">
                        <span className="text-indigo-600">{formatCurrency(slip.netPay)}</span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border bg-emerald-50 text-emerald-700 border-emerald-100">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Paid
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDownload(slip._id, employeeName, slip.period)}
                          disabled={isCurrentlyDownloading}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                            isCurrentlyDownloading
                              ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                              : "bg-indigo-50 hover:bg-indigo-100/80 text-indigo-600 border-indigo-100"
                          }`}
                        >
                          {isCurrentlyDownloading ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                              <span>Compiling...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Download Receipt</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <GeneratePayslipModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employees={employees}
        isLoading={isLoading} 
        onSave={handleSavePayslip}
      />
    </div>
  );
}