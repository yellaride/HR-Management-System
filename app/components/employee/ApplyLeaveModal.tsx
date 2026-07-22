"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, AlertTriangle } from "lucide-react";

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    type: "ANNUAL" | "SICK" | "CASUAL";
    startDate: string;
    endDate: string;
    reason: string;
  }) => Promise<void>;
}

const LEAVE_TYPES = [
  { value: "ANNUAL" as const, label: "Annual Leave" },
  { value: "SICK" as const, label: "Sick Leave" },
  { value: "CASUAL" as const, label: "Casual Leave" },
];

export default function ApplyLeaveModal({ isOpen, onClose, onSubmit }: ApplyLeaveModalProps) {
  const [form, setForm] = useState({
    type: "ANNUAL" as "ANNUAL" | "SICK" | "CASUAL",
    startDate: "",
    endDate: "",
    reason: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [isTypeOpen, setIsTypeOpen] = useState(false);

  // Ref to track clicks outside the leave type selector
  const typeRef = useRef<HTMLDivElement>(null);

  // Clear states when opening/closing modal (render-time adjustment pattern)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setForm({ type: "ANNUAL", startDate: "", endDate: "", reason: "" });
      setValidationError("");
      setIsTypeOpen(false);
    }
  }

  // Click outside listener for the custom dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (typeRef.current && !typeRef.current.contains(event.target as Node)) {
        setIsTypeOpen(false);
      }
    }

    if (isTypeOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isTypeOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      setValidationError("Please fill out all required fields.");
      return;
    }

    // Logic to prevent start date from occurring after the end date
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    if (start > end) {
      setValidationError("Start date cannot occur after the end date.");
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason.trim(),
      });
      setForm({ type: "ANNUAL", startDate: "", endDate: "", reason: "" });
      onClose();
    } catch (error) {
      console.error("Failed to submit request", error);
      setValidationError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper mapping validation error borders to fields
  const getInputClass = (hasError = false) => {
    const baseClass = "w-full px-3.5 py-2.5 bg-surface-card border rounded-xl text-xs text-content-main placeholder-content-muted transition-all duration-200 shadow-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed";
    const normalClass = "border-line-subtle hover:border-brand-accent/50 focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent";
    const errorClass = "border-rose-300 bg-rose-50/10 text-rose-900 hover:border-rose-400 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500";
    
    return `${baseClass} ${hasError ? errorClass : normalClass}`;
  };

  const selectedTypeLabel = LEAVE_TYPES.find((t) => t.value === form.type)?.label || "Annual Leave";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/35 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="relative bg-surface-card border border-line-subtle rounded-2xl max-w-md w-full p-6 shadow-2xl z-20 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Subtle purple accent line at the top */}
        <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-brand-accent to-brand-hover" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-line-subtle">
          <div>
            <h2 className="text-base font-extrabold text-content-main tracking-tight">Request Leave</h2>
            <p className="text-[11px] text-content-secondary mt-0.5 font-medium">Prepare details to queue leave request.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-content-muted hover:text-brand-accent hover:bg-brand-subtle transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          
          {/* Friendly Validation Alert Box */}
          {validationError && (
            <div className="flex items-start gap-3 p-3.5 bg-rose-50/75 border border-rose-100 rounded-xl text-rose-800 animate-in fade-in slide-in-from-top-1 duration-200">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold">Validation Notice</h4>
                <p className="text-[11px] text-rose-600/90 mt-0.5 font-medium">{validationError}</p>
              </div>
            </div>
          )}

          {/* Custom Styled Leave Type Dropdown */}
          <div className="space-y-1.5 relative" ref={typeRef}>
            <label className="field-label block">
              Select Leave Type
            </label>
            <button
              type="button"
              onClick={() => setIsTypeOpen(!isTypeOpen)}
              className={`${getInputClass()} flex items-center justify-between text-left cursor-pointer z-40 relative`}
            >
              <span>{selectedTypeLabel}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-content-muted transition-transform duration-200 ${isTypeOpen ? "rotate-180" : ""}`} />
            </button>

            {isTypeOpen && (
              <div className="dropdown-panel absolute left-0 right-0 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                {LEAVE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, type: type.value });
                      setIsTypeOpen(false);
                    }}
                    className={`dropdown-option ${
                      form.type === type.value ? "dropdown-option-active" : ""
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="field-label block">
                Start Date
              </label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className={`${getInputClass(!!validationError && (!form.startDate || new Date(form.startDate) > new Date(form.endDate)))} cursor-pointer`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="field-label block">
                End Date
              </label>
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className={`${getInputClass(!!validationError && (!form.endDate || new Date(form.startDate) > new Date(form.endDate)))} cursor-pointer`}
              />
            </div>
          </div>

          {/* Reason details */}
          <div className="space-y-1.5">
            <label className="field-label block">
              Leave Reason Details
            </label>
            <textarea
              rows={3}
              required
              placeholder="Provide supporting notes for your request..."
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className={`${getInputClass(!!validationError && !form.reason.trim())} resize-none leading-relaxed`}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end items-center gap-2 pt-4 border-t border-line-subtle shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4.5 py-2.5 text-xs font-bold text-content-secondary bg-surface-main hover:bg-brand-subtle hover:text-brand-accent rounded-xl border border-line-subtle transition disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4.5 py-2.5 text-xs font-bold text-white bg-brand-accent hover:bg-brand-hover rounded-xl shadow-xs hover:shadow-md transition duration-150 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Dispatching..." : "Dispatch Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}