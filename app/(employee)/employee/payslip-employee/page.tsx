"use client";

import React, { useEffect, useState, useRef } from "react";
import { Filter, ChevronDown } from "lucide-react";
import PayslipList from "@/app/components/payslips/PayslipList";
import { PayslipRecord } from "@/app/components/payslips/payslipPdf";
import { useSession } from "next-auth/react";

export default function PayslipEmployeePage() {
  const { data: session } = useSession();

  const [payslips, setPayslips] = useState<PayslipRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");

  const monthRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPayslips = async () => {
      if (!session?.user) return;

      try {
        setIsLoading(true);
        const response = await fetch("/api/employee/payslips");
        if (!response.ok) throw new Error("Failed to load payslips");

        const data = await response.json();
        const slips: PayslipRecord[] = Array.isArray(data)
          ? data
          : data.payslips || [];

        setPayslips(slips);
      } catch (error) {
        console.error("Error fetching employee payslips:", error);
        setPayslips([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayslips();
  }, [session?.user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (monthRef.current && !monthRef.current.contains(target)) {
        setIsMonthOpen(false);
      }
      if (yearRef.current && !yearRef.current.contains(target)) {
        setIsYearOpen(false);
      }
    }

    if (isMonthOpen || isYearOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMonthOpen, isYearOpen]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const uniqueYears = Array.from(
    new Set(
      payslips
        .map((slip) => {
          const parts = (slip.period || "").trim().split(" ");
          return parts.length > 1 ? parts[1] : null;
        })
        .filter((y): y is string => y !== null)
    )
  ).sort((a, b) => b.localeCompare(a));

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const normalizeMonth = (m: string) => m.trim().toLowerCase();

  const parsePeriod = (periodRaw: string): { monthName: string | null; year: string | null } => {
    const period = (periodRaw || "").trim();
    if (!period) return { monthName: null, year: null };

    const yearMatch = period.match(/(19\d{2}|20\d{2})/);
    const year = yearMatch ? yearMatch[1] : null;

    const normalized = period.replace(/,/g, " ").replace(/[-/]/g, " ").replace(/\s+/g, " ").trim();
    const tokens = normalized.split(" ");

    for (const month of monthNames) {
      if (normalized.toLowerCase().includes(month.toLowerCase())) {
        return { monthName: month, year };
      }
    }

    const shortToFull: Record<string, string> = {
      jan: "January",
      feb: "February",
      mar: "March",
      apr: "April",
      may: "May",
      jun: "June",
      jul: "July",
      aug: "August",
      sep: "September",
      sept: "September",
      oct: "October",
      nov: "November",
      dec: "December",
    };

    for (const t of tokens) {
      const key = t.slice(0, 4).toLowerCase();
      if (shortToFull[key]) {
        return { monthName: shortToFull[key], year };
      }
      const exactKey = t.toLowerCase();
      if (shortToFull[exactKey]) {
        return { monthName: shortToFull[exactKey], year };
      }
    }

    return { monthName: null, year };
  };

  const filteredPayslips = payslips.filter((slip) => {
    const { monthName, year } = parsePeriod(slip.period || "");

    const matchesMonth =
      selectedMonth === "All" ||
      (monthName ? normalizeMonth(monthName) === normalizeMonth(selectedMonth) : false);

    const matchesYear = selectedYear === "All" || (year ? year === selectedYear : false);

    return matchesMonth && matchesYear;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Block with Integrated Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-line-subtle">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-content-main">
            My Payslips
          </h1>
          <p className="mt-1 text-xs text-content-secondary leading-relaxed">
            Download your official pay statements and view breakdown history.
          </p>
        </div>

        {/* Action Filters Container */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Month Dropdown Filter */}
          <div className="relative w-full sm:w-auto" ref={monthRef}>
            <button
              type="button"
              title="Filter payslips by month"
              onClick={() => {
                setIsMonthOpen(!isMonthOpen);
                setIsYearOpen(false);
              }}
              className="w-full sm:w-auto flex items-center justify-between gap-2 bg-surface-card border border-line-subtle rounded-xl px-3.5 py-2.5 shadow-xs cursor-pointer text-xs font-semibold hover:border-brand-accent transition duration-150"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold text-content-muted uppercase tracking-wider">Month:</span>
                <span className="text-content-main">{selectedMonth === "All" ? "All Months" : selectedMonth}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-content-muted transition-transform duration-200 ${isMonthOpen ? "rotate-180" : ""}`} />
            </button>

            {isMonthOpen && (
              <div className="dropdown-panel absolute right-0 mt-1.5 w-full sm:w-48 max-h-60 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonth("All");
                    setIsMonthOpen(false);
                  }}
                  className={`dropdown-option ${
                    selectedMonth === "All" ? "dropdown-option-active" : ""
                  }`}
                >
                  All Months
                </button>
                {months.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(m);
                      setIsMonthOpen(false);
                    }}
                    className={`dropdown-option ${
                      selectedMonth === m ? "dropdown-option-active" : ""
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Year Dropdown Filter */}
          <div className="relative w-full sm:w-auto" ref={yearRef}>
            <button
              type="button"
              onClick={() => {
                setIsYearOpen(!isYearOpen);
                setIsMonthOpen(false);
              }}
              className="w-full sm:w-auto flex items-center justify-between gap-2 bg-surface-card border border-line-subtle rounded-xl px-3.5 py-2.5 shadow-xs cursor-pointer text-xs font-semibold hover:border-brand-accent transition duration-150"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold text-content-muted uppercase tracking-wider">Year:</span>
                <span className="text-content-main">{selectedYear === "All" ? "All Years" : selectedYear}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-content-muted transition-transform duration-200 ${isYearOpen ? "rotate-180" : ""}`} />
            </button>

            {isYearOpen && (
              <div className="dropdown-panel absolute right-0 mt-1.5 w-full sm:w-40">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedYear("All");
                    setIsYearOpen(false);
                  }}
                  className={`dropdown-option ${
                    selectedYear === "All" ? "dropdown-option-active" : ""
                  }`}
                >
                  All Years
                </button>
                {uniqueYears.map((year) => (
                  <button
                    key={year}
                    type="button"
                    onClick={() => {
                      setSelectedYear(year);
                      setIsYearOpen(false);
                    }}
                    className={`dropdown-option ${
                      selectedYear === year ? "dropdown-option-active" : ""
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Count Counter */}
      <div className="flex items-center justify-between px-1">
        <div className="inline-flex items-center gap-1.5 text-content-secondary text-xs font-medium">
          <Filter className="w-3.5 h-3.5 text-content-muted" />
          <span>
            Showing {filteredPayslips.length} of {payslips.length} paid records
          </span>
        </div>
      </div>

      {/* Payslip Table Component */}
      <PayslipList
        payslips={filteredPayslips}
        isLoading={isLoading}
        downloadingId={downloadingId}
        onDownloadStart={(id) => setDownloadingId(id)}
        onDownloadEnd={() => setDownloadingId(null)}
        title="Your Paid Records"
        emptyMessage="No payslips match your chosen month and year filter parameters."
        formatCurrency={(amount) =>
          new Intl.NumberFormat("en-PK", {
            style: "currency",
            currency: "PKR",
            currencyDisplay: "symbol",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })
            .format(amount)
            .replace(/\u0024/g, "")
        }
        showAdminControls={false}
        showEmployeeColumn={false}
        showDetailedBreakdown={true}
        showVersion={false}
      />
    </div>
  );
}