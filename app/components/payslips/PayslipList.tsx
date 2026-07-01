"use client";

import React from "react";
import { Calendar, CheckCircle2, Download, AlertCircle } from "lucide-react";
import { downloadPayslipPdf, PayslipRecord } from "./payslipPdf";

interface PayslipListProps {
  payslips: PayslipRecord[];
  isLoading?: boolean;
  downloadingId?: string | null;
  onDownloadStart?: (id: string) => void;
  onDownloadEnd?: (id: string) => void;
  title?: string;
  emptyMessage?: string;
  showAdminControls?: boolean;
  formatCurrency?: (amount: number) => string;
}

export default function PayslipList({
  payslips,
  isLoading = false,
  downloadingId = null,
  onDownloadStart,
  onDownloadEnd,
  title = "Paid Records",
  emptyMessage = "No matching paid payslips found.",
  showAdminControls = false,
  formatCurrency,
}: PayslipListProps) {
  const handleDownload = async (slip: PayslipRecord) => {
    if (onDownloadStart) onDownloadStart(slip._id);

    const employeeObj = typeof slip.employeeId === "object" && slip.employeeId !== null ? slip.employeeId : null;
    const employeeName = employeeObj?.name || slip.employeeName || "Unknown Employee";
    const employeeRole = employeeObj?.jobTitle || slip.employeeRole || "No Specified Title";

    try {
      await downloadPayslipPdf({
        slip,
        employeeName,
        employeeRole,
        formatCurrency,
      });
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Something went wrong while compiling the PDF. Please verify your client environment details.");
    } finally {
      if (onDownloadEnd) onDownloadEnd(slip._id);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="text-xs font-bold text-slate-800 tracking-wide uppercase">{title}</div>
        {!showAdminControls && (
          <div className="inline-flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
            <span>{payslips.length} records</span>
          </div>
        )}
      </div>

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
            ) : payslips.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-6 h-6 text-slate-300" />
                    <span>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              payslips.map((slip) => {
                const employeeObj = typeof slip.employeeId === "object" && slip.employeeId !== null ? slip.employeeId : null;
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
                          <span className="font-bold text-slate-900 block leading-tight">{employeeName}</span>
                          <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">{employeeRole}</span>
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
                      {formatCurrency ? formatCurrency(slip.basicSalary) : slip.basicSalary}
                    </td>

                    <td className="px-6 py-4 text-right font-extrabold text-slate-900">
                      <span className="text-indigo-600">{formatCurrency ? formatCurrency(slip.netPay) : slip.netPay}</span>
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
                        onClick={() => handleDownload(slip)}
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
  );
}
