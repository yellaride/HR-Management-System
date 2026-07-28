"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import { Search, Filter, Building2 } from "lucide-react";
import GeneratePayslipModal, { EmployeeOption } from "@/app/components/admin/GeneratePayslipModal";
import PayslipList, { CompanyDetailsData } from "@/app/components/payslips/PayslipList";
import { FilterSelect } from "@/app/components/ui/FilterSelect";

const ExtendedGeneratePayslipModal = GeneratePayslipModal as React.ComponentType<
  React.ComponentProps<typeof GeneratePayslipModal> & { companyDetails?: CompanyDetailsData | null }
>;

interface ReferencedEmployee {
  _id: string;
  name: string;
  jobTitle: string;
}

interface Payslip {
  _id: string;
  employeeId: ReferencedEmployee | null;
  employeeName?: string;
  employeeRole?: string;
  period: string;
  basicSalary: number;
  allowances: number;
  bonus: number;
  deductions: number;
  netPay: number;
  paymentMethod?: string;
  paymentDate?: string;
  status?: string;
  version?: string;
}

export default function AdminPayslipsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Both requests run in parallel and are cached — the employees key is
  // shared with the admin Employees page.
  const {
    data: payslipData,
    isLoading,
    mutate: mutatePayslips,
  } = useSWR<unknown>("/api/admin/payslips");

  const { data: employeeData } = useSWR<unknown>("/api/admin/employees");

  const { payslips, companyDetails } = useMemo(() => {
    const data = payslipData as
      | Payslip[]
      | { payslips?: Payslip[]; data?: Payslip[]; companyDetails?: CompanyDetailsData }
      | undefined;

    if (Array.isArray(data)) {
      return { payslips: data, companyDetails: null };
    }
    return {
      payslips: data?.payslips || data?.data || [],
      companyDetails: data?.companyDetails || null,
    };
  }, [payslipData]);

  const employees = useMemo<EmployeeOption[]>(() => {
    const data = employeeData as
      | EmployeeOption[]
      | { employees?: EmployeeOption[]; data?: EmployeeOption[] }
      | undefined;
    if (Array.isArray(data)) return data;
    return data?.employees || data?.data || [];
  }, [employeeData]);

  // Payslips reference the employee _id; the directory list carries each
  // employee's department, so one lookup map links the two.
  const departmentByEmployeeId = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((emp) => {
      const empId = emp.id || emp._id;
      if (empId && emp.department) map.set(String(empId), emp.department);
    });
    return map;
  }, [employees]);

  const departmentOptions = useMemo(() => {
    const unique = Array.from(
      new Set(
        employees
          .map((emp) => emp.department)
          .filter((dept): dept is string => Boolean(dept?.trim()))
      )
    ).sort((a, b) => a.localeCompare(b));

    return [
      { value: "All", label: "All Departments" },
      ...unique.map((dept) => ({ value: dept, label: dept })),
    ];
  }, [employees]);

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
    netPay: number;
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
      mutatePayslips(
        (current: unknown) => {
          if (Array.isArray(current)) return [savedPayslip, ...current];
          const obj = (current ?? {}) as { payslips?: Payslip[] };
          return { ...obj, payslips: [savedPayslip, ...(obj.payslips || [])] };
        },
        { revalidate: false }
      );
      setIsModalOpen(false);
    } catch (err) {
      console.error("Submission failed:", err);
      alert(err instanceof Error ? err.message : "Failed to record payment. Please check parameters and try again.");
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

    const slipDepartment = employeeObj?._id
      ? departmentByEmployeeId.get(String(employeeObj._id))
      : undefined;
    const matchesDepartment =
      departmentFilter === "All" || slipDepartment === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  const hasActiveFilters = searchQuery.trim().length > 0 || departmentFilter !== "All";

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-line-subtle">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-content-main tracking-tight">
            Paid Payslips Ledger
          </h1>
          <p className="mt-1 text-xs text-content-secondary leading-relaxed">
            Monitor compensations and download generated PDF receipt summaries for completed payments.
          </p>
        </div>

        {/* Toolbar: search + department filter + action, all one height */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-content-muted" />
            </div>
            <input
              type="text"
              placeholder="Search paid payroll history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-9 pr-3.5 py-2 bg-surface-card border border-line-subtle rounded-xl text-xs text-content-main placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent transition duration-150 shadow-xs"
            />
          </div>

          {/* Department Filter */}
          <FilterSelect
            ariaLabel="Filter by department"
            icon={<Building2 className="w-3.5 h-3.5" />}
            options={departmentOptions}
            value={departmentFilter}
            onChange={setDepartmentFilter}
            className="w-full sm:w-48"
          />

          {/* Record Payment Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 bg-brand-accent hover:bg-brand-hover text-white text-xs font-bold rounded-xl shadow-xs transition-all duration-150 active:scale-[0.98] cursor-pointer whitespace-nowrap"
          >
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Counter Row */}
      <div className="flex items-center justify-between px-1">
        <div className="inline-flex items-center gap-1.5 text-content-secondary text-[11px] font-semibold">
          <Filter className="w-3.5 h-3.5 text-content-muted" />
          <span>
            Showing {filteredPayslips.length} paid entries
            {departmentFilter !== "All" ? ` in ${departmentFilter}` : ""}
          </span>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setDepartmentFilter("All");
            }}
            className="text-[11px] font-bold text-brand-accent hover:text-brand-hover transition cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Payslips Table List */}
      <PayslipList
        payslips={filteredPayslips}
        isLoading={isLoading}
        downloadingId={downloadingId}
        onDownloadStart={(id) => setDownloadingId(id)}
        onDownloadEnd={() => setDownloadingId(null)}
        title="Paid Records"
        showAdminControls
        showVersion={true}
        formatCurrency={formatCurrency}
        companyDetails={companyDetails}
      />

      {/* Generate Payslip Modal */}
      <ExtendedGeneratePayslipModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employees={employees}
        isLoading={isLoading} 
        onSave={handleSavePayslip}
        companyDetails={companyDetails}
      />
    </div>
  );
}