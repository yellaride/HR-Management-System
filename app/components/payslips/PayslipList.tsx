"use client";

import React from "react";
import Swal from "sweetalert2";
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
  showEmployeeColumn?: boolean; 
  showDetailedBreakdown?: boolean; 
  formatCurrency?: (amount: number) => string;
}

const swalCustomClass = {
  popup: "bg-white rounded-2xl border border-[var(--color-line-subtle)] shadow-xl font-sans",
  title: "text-sm font-bold text-[var(--color-content-main)]",
  htmlContainer: "text-xs text-[var(--color-content-secondary)]",
  confirmButton: "px-4.5 py-2.5 text-xs font-bold rounded-xl text-white bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-hover)] border-none outline-none cursor-pointer transition",
};

export default function PayslipList({
  payslips,
  isLoading = false,
  downloadingId = null,
  onDownloadStart,
  onDownloadEnd,
  title = "Paid Records",
  emptyMessage = "No matching paid payslips found.",
  showAdminControls = false,
  showEmployeeColumn = true, 
  showDetailedBreakdown = false, 
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
      Swal.fire({
        icon: "error",
        title: "Compilation Failed",
        text: "Could not generate your receipt. Please verify your client environment details and try again.",
        confirmButtonColor: "#7c3aed",
        customClass: swalCustomClass
      });
    } finally {
      if (onDownloadEnd) onDownloadEnd(slip._id);
    }
  };

  let totalColumns = 5; 
  if (showEmployeeColumn) totalColumns += 1;
  if (showDetailedBreakdown) totalColumns += 3; 

  return (
    <div className="table-card">
      {/* Header Panel */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-line-subtle)] bg-[var(--color-surface-main)]/60">
        <div className="text-xs font-bold text-[var(--color-content-main)] tracking-wide uppercase">
          {title}
        </div>

        {!showAdminControls && (
          <div className="inline-flex items-center gap-1.5 text-[var(--color-content-secondary)] text-[11px] font-semibold">
            <span>{payslips.length} records</span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="table-head">
              {showEmployeeColumn && <th className="px-6 py-4">Employee</th>}
              <th className="px-6 py-4">Pay Period</th>
              <th className="px-6 py-4 text-right">Basic Salary</th>
              
              {showDetailedBreakdown && (
                <>
                  <th className="px-6 py-4 text-right text-emerald-600">Allowances</th>
                  <th className="px-6 py-4 text-right text-[var(--color-brand-accent)]">Bonus</th>
                  <th className="px-6 py-4 text-right text-rose-600">Deductions</th>
                </>
              )}
              
              <th className="px-6 py-4 text-right">Net Take-Home</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-line-subtle)] text-[var(--color-content-secondary)] text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={totalColumns} className="px-6 py-12 text-center text-[var(--color-content-muted)]">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-6 h-6 border-2 border-[var(--color-brand-accent)] border-t-transparent rounded-full animate-spin" />
                    <span className="font-medium">Loading payroll records...</span>
                  </div>
                </td>
              </tr>
            ) : payslips.length === 0 ? (
              <tr>
                <td colSpan={totalColumns} className="px-6 py-12 text-center text-[var(--color-content-muted)]">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-6 h-6 text-[var(--color-content-muted)]/60" />
                    <span className="font-medium">{emptyMessage}</span>
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
                  <tr key={slip._id} className="table-row-hover">
                    {showEmployeeColumn && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[var(--color-brand-subtle)] text-[var(--color-brand-accent)] border border-[var(--color-line-subtle)] flex items-center justify-center font-bold text-[11px]">
                            {initials}
                          </div>
                          <div>
                            <span className="font-bold text-[var(--color-content-main)] block leading-tight">{employeeName}</span>
                            <span className="text-[10px] text-[var(--color-content-muted)] font-medium mt-0.5 block">{employeeRole}</span>
                          </div>
                        </div>
                      </td>
                    )}

                    <td className="px-6 py-4">
                      <span className="font-semibold text-[var(--color-content-main)] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[var(--color-content-muted)]" />
                        {slip.period}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right font-semibold text-[var(--color-content-secondary)]">
                      {formatCurrency ? formatCurrency(slip.basicSalary) : slip.basicSalary}
                    </td>

                    {showDetailedBreakdown && (
                      <>
                        <td className="px-6 py-4 text-right font-semibold text-emerald-600">
                          {formatCurrency ? formatCurrency(slip.allowances || 0) : (slip.allowances || 0)}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-[var(--color-brand-accent)]">
                          {formatCurrency ? formatCurrency(slip.bonus || 0) : (slip.bonus || 0)}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-rose-600">
                          -{formatCurrency ? formatCurrency(slip.deductions || 0) : (slip.deductions || 0)}
                        </td>
                      </>
                    )}

                    <td className="px-6 py-4 text-right font-extrabold text-[var(--color-content-main)]">
                      <span className="text-[var(--color-brand-accent)]">
                        {formatCurrency ? formatCurrency(slip.netPay) : slip.netPay}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center">
                        <span className="status-pill bg-emerald-50 text-emerald-700 border-emerald-100">
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
                            ? "bg-[var(--color-surface-main)] text-[var(--color-content-muted)] border-[var(--color-line-subtle)] cursor-not-allowed"
                            : "bg-[var(--color-brand-subtle)] hover:bg-[var(--color-brand-accent)] hover:text-white text-[var(--color-brand-accent)] border-[var(--color-brand-subtle)] cursor-pointer"
                        }`}
                      >
                        {isCurrentlyDownloading ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-[var(--color-content-muted)] border-t-transparent rounded-full animate-spin" />
                            <span>Compiling...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Receipt</span>
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