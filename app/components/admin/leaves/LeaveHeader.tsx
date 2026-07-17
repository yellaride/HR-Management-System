// components/LeaveHeader.tsx
import React from "react";
import { Search } from "lucide-react";

interface LeaveHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const LeaveHeader: React.FC<LeaveHeaderProps> = ({
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[var(--color-line-subtle)]">
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--color-content-main)] tracking-tight">
          Designation

        </h1>
        <p className="mt-1 text-xs text-[var(--color-content-secondary)] font-medium">
          Review, approve, and filter all employee leave requests and historical records.
        </p>
      </div>

      <div className="relative w-full md:w-72">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          <Search className="h-4 w-4 text-[var(--color-content-muted)] transition-colors duration-200 group-hover:text-[var(--color-content-main)]" />
        </div>
        <input
          type="text"
          placeholder="Search employee, type, or reason..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="form-input-with-icon text-xs py-2 h-9 pl-9"
        />
      </div>
    </div>
  );
};