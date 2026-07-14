"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Filter, ChevronDown } from "lucide-react";

interface FilterProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  filterDept: string;
  onDeptChange: (val: string) => void;
  filterStatus: string;
  onStatusChange: (val: string) => void;
  departments: string[];
  statuses: string[];
  onClear: () => void;
}

export default function AttendanceFilters({
  searchQuery,
  onSearchChange,
  filterDept,
  onDeptChange,
  filterStatus,
  onStatusChange,
  departments,
  statuses,
  onClear,
}: FilterProps) {
  // Visibility states for custom dropdown containers
  const [isDeptOpen, setIsDeptOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  // Element refs to track clicks outside dropdown panels
  const deptRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);

  // Click-outside tracking effect to close active panels safely
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (deptRef.current && !deptRef.current.contains(target)) {
        setIsDeptOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(target)) {
        setIsStatusOpen(false);
      }
    }

    if (isDeptOpen || isStatusOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDeptOpen, isStatusOpen]);

  // Unified theme class mapping for the custom dropdown buttons
  const getTriggerClass = () => {
    return "w-full px-3.5 py-2.5 bg-[var(--color-surface-card)] border border-[var(--color-line-subtle)] rounded-xl text-xs text-[var(--color-content-main)] placeholder-[var(--color-content-muted)] transition-all duration-200 shadow-sm outline-none hover:border-[var(--color-brand-accent)]/50 focus:ring-2 focus:ring-[var(--color-brand-accent)]/20 focus:border-[var(--color-brand-accent)] flex items-center justify-between text-left cursor-pointer relative";
  };

  return (
    <div className="bg-white border border-[var(--color-line-subtle)] rounded-2xl p-4 shadow-3xs">
      
      {/* Search Header Info */}
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-dashed border-slate-100">
        <Filter className="w-3.5 h-3.5 text-[var(--color-brand-accent)]" />
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-content-main)]">
          Search Directory Filter
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        
        {/* 1. Search Bar with Icon */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-3.5 h-3.5 text-[var(--color-content-muted)]" />
          <input
            type="text"
            placeholder="Search by ID or Name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="form-input-with-icon"
          />
        </div>

        {/* 2. Custom Styled Department Dropdown */}
        <div className="relative" ref={deptRef}>
          <button
            type="button"
            onClick={() => {
              setIsDeptOpen(!isDeptOpen);
              setIsStatusOpen(false);
            }}
            className={getTriggerClass()}
          >
            <span>{filterDept === "All" ? "All Departments" : filterDept}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[var(--color-content-muted)] transition-transform duration-200 ${isDeptOpen ? "rotate-180" : ""}`} />
          </button>

          {isDeptOpen && (
            <div className="dropdown-panel absolute left-0 right-0 mt-1.5 max-h-40 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150 z-50">
              {departments.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => {
                    onDeptChange(dept);
                    setIsDeptOpen(false);
                  }}
                  className={`dropdown-option ${
                    filterDept === dept ? "dropdown-option-active" : ""
                  }`}
                >
                  {dept === "All" ? "All Departments" : dept}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. Custom Styled Status Dropdown */}
        <div className="relative" ref={statusRef}>
          <button
            type="button"
            onClick={() => {
              setIsStatusOpen(!isStatusOpen);
              setIsDeptOpen(false);
            }}
            className={getTriggerClass()}
          >
            <span>{filterStatus === "All" ? "All Statuses" : filterStatus}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[var(--color-content-muted)] transition-transform duration-200 ${isStatusOpen ? "rotate-180" : ""}`} />
          </button>

          {isStatusOpen && (
            <div className="dropdown-panel absolute left-0 right-0 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-150 z-50">
              {statuses.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    onStatusChange(status);
                    setIsStatusOpen(false);
                  }}
                  className={`dropdown-option ${
                    filterStatus === status ? "dropdown-option-active" : ""
                  }`}
                >
                  {status === "All" ? "All Statuses" : status}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 4. Reset Button */}
        <button
          onClick={() => {
            onClear();
            setIsDeptOpen(false);
            setIsStatusOpen(false);
          }}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[var(--color-content-main)] border border-[var(--color-line-subtle)] rounded-xl text-xs font-bold transition cursor-pointer"
        >
          Reset Filter Box
        </button>

      </div>
    </div>
  );
}