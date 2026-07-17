"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Filter, ChevronDown, Check } from "lucide-react";

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

  return (
    <div className="bg-surface-card border border-line-subtle rounded-2xl p-5 shadow-sm">
      
      {/* 1. Header Area with Subtle Accent Highlight */}
      <div className="flex items-center gap-2.5 pb-3.5 mb-4 border-b border-line-subtle">
        <div className="w-6 h-6 rounded-lg bg-brand-subtle flex items-center justify-center text-brand-accent shadow-2xs select-none">
          <Filter className="w-3.5 h-3.5" />
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-content-main">
          Directory Filters & Search
        </span>
      </div>

      {/* 2. Responsive Grid with balanced spacing ratios (4:3:3:2) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
        
        {/* Search Bar - Explicitly styled and spaced to prevent text-icon merging */}
        <div className="relative w-full md:col-span-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none select-none" />
          <input
            type="text"
            placeholder="Search by ID or Name..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="form-input !pl-10 w-full"
          />
        </div>

        {/* Custom Styled Department Dropdown */}
        <div className="relative w-full md:col-span-3" ref={deptRef}>
          <button
            type="button"
            onClick={() => {
              setIsDeptOpen(!isDeptOpen);
              setIsStatusOpen(false);
            }}
            className={`dropdown-trigger flex items-center justify-between text-left transition-all duration-200 ${
              isDeptOpen 
                ? "border-brand-accent ring-2 ring-brand-accent/15" 
                : "hover:border-brand-accent/40"
            }`}
          >
            <span className="truncate">
              {filterDept === "All" ? "All Departments" : filterDept}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-content-muted transition-transform duration-350 shrink-0 ${isDeptOpen ? "rotate-180 text-brand-accent" : ""}`} />
          </button>

          {isDeptOpen && (
            <div className="dropdown-panel absolute left-0 right-0 mt-1.5 max-h-48 overflow-y-auto vertical-slider-reset animate-in fade-in slide-in-from-top-1 duration-150 z-50">
              {departments.map((dept) => {
                const isActive = filterDept === dept;
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => {
                      onDeptChange(dept);
                      setIsDeptOpen(false);
                    }}
                    className={`dropdown-option flex items-center justify-between ${
                      isActive ? "dropdown-option-active" : ""
                    }`}
                  >
                    <span>{dept === "All" ? "All Departments" : dept}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-brand-accent shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom Styled Status Dropdown */}
        <div className="relative w-full md:col-span-3" ref={statusRef}>
          <button
            type="button"
            onClick={() => {
              setIsStatusOpen(!isStatusOpen);
              setIsDeptOpen(false);
            }}
            className={`dropdown-trigger flex items-center justify-between text-left transition-all duration-200 ${
              isStatusOpen 
                ? "border-brand-accent ring-2 ring-brand-accent/15" 
                : "hover:border-brand-accent/40"
            }`}
          >
            <span className="truncate">
              {filterStatus === "All" ? "All Statuses" : filterStatus}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-content-muted transition-transform duration-350 shrink-0 ${isStatusOpen ? "rotate-180 text-brand-accent" : ""}`} />
          </button>

          {isStatusOpen && (
            <div className="dropdown-panel absolute left-0 right-0 mt-1.5 max-h-48 overflow-y-auto vertical-slider-reset animate-in fade-in slide-in-from-top-1 duration-150 z-50">
              {statuses.map((status) => {
                const isActive = filterStatus === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      onStatusChange(status);
                      setIsStatusOpen(false);
                    }}
                    className={`dropdown-option flex items-center justify-between ${
                      isActive ? "dropdown-option-active" : ""
                    }`}
                  >
                    <span>{status === "All" ? "All Statuses" : status}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-brand-accent shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Reset Button - Leverages standard btn-outline configuration */}
        <button
          onClick={() => {
            onClear();
            setIsDeptOpen(false);
            setIsStatusOpen(false);
          }}
          className="btn-outline !w-full md:col-span-2 !py-2.5 text-xs font-bold cursor-pointer"
        >
          Reset Filters
        </button>

      </div>
    </div>
  );
}