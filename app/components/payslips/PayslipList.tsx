"use client";

import React from "react";
import Swal from "sweetalert2";
import { Calendar, CheckCircle2, Download, AlertCircle } from "lucide-react";
import { downloadPayslipPdf, PayslipRecord } from "./payslipPdf";

export interface ExtendedPayslipRecord extends PayslipRecord {
  status?: string;
  version?: string;
}

export interface CompanyDetailsData {
  name?: string;
  address?: string;
  email?: string;
  phone?: string;
  logo?: string;
  [key: string]: any;
}

interface PayslipListProps {
  payslips: ExtendedPayslipRecord[];
  isLoading?: boolean;
  downloadingId?: string | null;
  onDownloadStart?: (id: string) => void;
  onDownloadEnd?: (id: string) => void;
  title?: string;
  emptyMessage?: string;
  showAdminControls?: boolean;
  showEmployeeColumn?: boolean; 
  showDetailedBreakdown?: boolean;
  showVersion?: boolean;
  formatCurrency?: (amount: number) => string;
  companyDetails?: CompanyDetailsData | null; // Keep companyDetails in the prop definitions
}

const swalCustomClass = {
  popup: "bg-white rounded-2xl border border-[var(--color-line-subtle)] shadow-xl font-sans",
  title: "text-sm font-bold text-[var(--color-content-main)]",
  htmlContainer: "text-xs text-[var(--color-content-secondary)]",
  confirmButton: "px-4.5 py-2.5 text-xs font-bold rounded-xl text-white bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-hover)] border-none outline-none cursor-pointer transition",
};

// Declaring ": React.JSX.Element" tells TypeScript this function must return JSX
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
  showVersion = false,
  formatCurrency,
  companyDetails = null,
}: PayslipListProps): React.JSX.Element {
  
  const handleDownload = async (slip: PayslipRecord) => {
    if (onDownloadStart) onDownloadStart(slip._id);

    try {
      // Fetch dynamic details for this precise payslip ID using a query parameter
      const res = await fetch(`/api/admin/payslips?id=${slip._id}`);
      if (!res.ok) {
        throw new Error(`Server returned status: ${res.status}`);
      }

      const { payslip: freshSlip, companyDetails: freshCompanyDetails } = await res.json();

      const employeeObj = typeof freshSlip.employeeId === "object" && freshSlip.employeeId !== null 
        ? freshSlip.employeeId 
        : null;
      
      const employeeName = employeeObj?.name || freshSlip.employeeName || "Unknown Employee";
      const employeeRole = employeeObj?.jobTitle || freshSlip.employeeRole || "No Specified Title";

      // Call PDF compiler with database values
      await downloadPayslipPdf({
        slip: freshSlip,
        employeeName,
        employeeRole,
        formatCurrency,
        companyDetails: freshCompanyDetails || companyDetails, 
      });

    } catch (error) {
      console.error("Failed to generate PDF:", error);
      Swal.fire({
        icon: "error",
        title: "Compilation Failed",
        text: "Could not generate your receipt. Please verify your database connection and try again.",
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
  if (showVersion) totalColumns += 1;

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
              {showVersion && (
                <th className="px-6 py-4 text-center">Version</th>
              )}
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
                          {(() => {
                            const imageUrl =
                              (employeeObj as any)?.profilePhotoUrl ||
                              (employeeObj as any)?.profilePhotoURL ||
                              (employeeObj as any)?.profilePhoto ||
                              (employeeObj as any)?.image ||
                              (employeeObj as any)?.picture ||
                              (employeeObj as any)?.profilePicture ||
                              (employeeObj as any)?.profilePic;

                            if (typeof imageUrl === "string" && imageUrl.trim()) {
                              return (
                                <div className="w-9 h-9 rounded-xl bg-[var(--color-brand-subtle)] text-[var(--color-brand-accent)] border border-[var(--color-line-subtle)] overflow-hidden">
                                  <img
                                    src={imageUrl}
                                    alt={employeeName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.currentTarget;
                                      target.onerror = null;
                                      target.style.display = "none";
                                    }}
                                  />
                                </div>
                              );
                            }

                            return (
                              <div className="w-9 h-9 rounded-xl bg-[var(--color-brand-subtle)] text-[var(--color-brand-accent)] border border-[var(--color-line-subtle)] flex items-center justify-center font-bold text-[11px]">
                                {initials}
                              </div>
                            );
                          })()}
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

                    {showVersion && (
                      <td className="px-6 py-4 text-center">
                        {String((slip as any).version ?? (slip as any).Version ?? "").trim() ? (
                          <span className="font-bold text-[var(--color-content-secondary)]">
                            {String((slip as any).version ?? (slip as any).Version)}
                          </span>
                        ) : (
                          <span className="text-[var(--color-content-muted)]">-</span>
                        )}
                      </td>
                    )}

                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center">
                        {slip.status === "Suspended" ? (
                          <span className="status-pill bg-rose-50 text-rose-700 border-rose-100">
                            <AlertCircle className="w-3 h-3 text-rose-500" />
                            Suspended
                          </span>
                        ) : slip.status === "Active" ? (
                          <span className="status-pill bg-emerald-50 text-emerald-700 border-emerald-100">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="status-pill bg-slate-50 text-slate-700 border-slate-100">
                            <AlertCircle className="w-3 h-3 text-slate-500" />
                            Unknown
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDownload(slip)}
                        disabled={isCurrentlyDownloading}
                        className={`btn-table-download ${
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