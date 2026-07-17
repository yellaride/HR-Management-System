// components/LeaveFilters.tsx
import React from "react";
import { Filter } from "lucide-react";

type TabType = "All" | "Pending" | "Approved" | "Rejected";

interface LeaveFiltersProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  count: number;
  loading: boolean;
}

export const LeaveFilters: React.FC<LeaveFiltersProps> = ({
  activeTab,
  setActiveTab,
  count,
  loading,
}) => {
  const tabs: TabType[] = ["All", "Pending", "Approved", "Rejected"];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4 border-b border-[var(--color-line-subtle)] bg-[var(--color-surface-main)]/50">
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
              activeTab === tab
                ? "bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-hover)] text-white shadow-xs"
                : "text-[var(--color-content-secondary)] hover:text-[var(--color-content-main)] hover:bg-[var(--color-brand-subtle)]/60"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="inline-flex items-center gap-1.5 text-[var(--color-content-secondary)] text-[11px] font-semibold">
        <Filter className="w-3.5 h-3.5 text-[var(--color-content-muted)]" />
        <span>Showing {loading ? "..." : count} leaves</span>
      </div>
    </div>
  );
};