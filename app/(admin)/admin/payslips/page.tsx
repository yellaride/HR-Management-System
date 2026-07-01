"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter } from "lucide-react";
import GeneratePayslipModal, { EmployeeOption } from "@/app/components/admin/GeneratePayslipModal";
import PayslipList from "@/app/components/payslips/PayslipList";

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
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      currencyDisplay: "symbol",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace(/\u0024/g, "");
  };

  const handleSavePayslip = async (newSlip: {
    employeeId: string;
    period: string;
    basicSalary: number;
    allowances: number;
    deductions: number;
    bonus: number;
    netPay: number; // Added netPay so backend schema validations pass
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
        const rawText = await response.text();
        let errorMessage = `HTTP error! Status: ${response.status}`;

        try {
          const errorData = JSON.parse(rawText);
          errorMessage = errorData.error || errorData.message || errorData.details || errorMessage;
        } catch {
          if (rawText) {
            errorMessage = rawText.slice(0, 200);
          }
        }
        throw new Error(errorMessage);
      }

      const savedPayslip: Payslip = await response.json();
      setPayslips((prev) => [savedPayslip, ...prev]);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Submission failed:", err);
      alert(err.message || "Failed to record payment. Please check parameters and try again.");
    }
  };

  const filteredPayslips = (payslips || []).filter((slip) => {
    const employeeObj = typeof slip.employeeId === "object" && slip.employeeId !== null 
      ? slip.employeeId 
      : null;

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
      <div className="flex items-center justify-between px-1 py-2">
        <div className="inline-flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
          <Filter className="w-3.5 h-3.5" />
          <span>Showing {filteredPayslips.length} paid entries</span>
        </div>
      </div>

      <PayslipList
        payslips={filteredPayslips}
        isLoading={isLoading}
        downloadingId={downloadingId}
        onDownloadStart={(id) => setDownloadingId(id)}
        onDownloadEnd={() => setDownloadingId(null)}
        title="Paid Records"
        showAdminControls
        formatCurrency={formatCurrency}
      />

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