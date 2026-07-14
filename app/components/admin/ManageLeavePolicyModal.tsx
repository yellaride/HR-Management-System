"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Search, User, ChevronDown, Save, CheckCircle2, AlertCircle } from "lucide-react";

interface EmployeePolicy {
  userId: string;
  name: string;
  email: string;
  isCustom: boolean;
  policy: {
    ANNUAL: number;
    SICK: number;
    CASUAL: number;
    MONTHLY: number;
  };
}

interface ManageLeavePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: EmployeePolicy[];
  selectedEmployee: EmployeePolicy | null;
  onSave: (
    userId: string,
    policy: { ANNUAL: number; SICK: number; CASUAL: number; MONTHLY: number }
  ) => Promise<void>;
}

export default function ManageLeavePolicyModal({
  isOpen,
  onClose,
  employees,
  selectedEmployee: initialSelectedEmployee,
  onSave,
}: ManageLeavePolicyModalProps) {
  // Dropdown & Search states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Selected Employee & Form Values (using number | "" to handle leading zeros & easy backspacing)
  const [selectedEmp, setSelectedEmp] = useState<EmployeePolicy | null>(null);
  const [tempAnnual, setTempAnnual] = useState<number | "">("");
  const [tempSick, setTempSick] = useState<number | "">("");
  const [tempCasual, setTempCasual] = useState<number | "">("");
  const [tempMonthly, setTempMonthly] = useState<number | "">("");

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localBanner, setLocalBanner] = useState<{ status: "success" | "error"; message: string } | null>(null);

  // Update form inputs when initial employee changes
  useEffect(() => {
    if (initialSelectedEmployee) {
      setSelectedEmp(initialSelectedEmployee);
      setTempAnnual(initialSelectedEmployee.policy.ANNUAL);
      setTempSick(initialSelectedEmployee.policy.SICK);
      setTempCasual(initialSelectedEmployee.policy.CASUAL);
      setTempMonthly(initialSelectedEmployee.policy.MONTHLY ?? 2);
    } else {
      setSelectedEmp(null);
      resetForm();
    }
  }, [initialSelectedEmployee, isOpen]);

  // Handle dropdown outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const resetForm = () => {
    setTempAnnual(15);
    setTempSick(8);
    setTempCasual(6);
    setTempMonthly(2);
    setDropdownSearch("");
    setLocalBanner(null);
  };

  const showBanner = (status: "success" | "error", message: string) => {
    setLocalBanner({ status, message });
    if (status === "success") {
      setTimeout(() => {
        setLocalBanner(null);
        onClose();
      }, 1500); // Auto-closes modal shortly after successful save
    }
  };

  const handleSelectEmployee = (emp: EmployeePolicy) => {
    setSelectedEmp(emp);
    setTempAnnual(emp.policy.ANNUAL);
    setTempSick(emp.policy.SICK);
    setTempCasual(emp.policy.CASUAL);
    setTempMonthly(emp.policy.MONTHLY ?? 2);
    setIsDropdownOpen(false);
    setDropdownSearch("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) {
      showBanner("error", "Please select an employee first.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(selectedEmp.userId, {
        ANNUAL: Number(tempAnnual || 0),
        SICK: Number(tempSick || 0),
        CASUAL: Number(tempCasual || 0),
        MONTHLY: Number(tempMonthly || 0),
      });
      showBanner("success", `Leave policy updated successfully for ${selectedEmp.name}`);
    } catch (err: any) {
      showBanner("error", err?.message || "Failed to update configurations.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe input parser to completely prevent leading zeroes (like "03" -> "3")
  const handleNumericInput = (val: string, setter: (num: number | "") => void) => {
    if (val === "") {
      setter("");
      return;
    }
    // Remove leading zeros except when the value itself is single digit "0"
    const cleaned = val.replace(/^0+/, "");
    setter(cleaned === "" ? 0 : parseInt(cleaned, 10));
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(dropdownSearch.toLowerCase()) ||
      emp.email.toLowerCase().includes(dropdownSearch.toLowerCase())
  );

  const inputClass =
    "w-full px-3.5 py-2.5 bg-[var(--color-surface-card,white)] border border-[var(--color-line-subtle,#e2e0e8)] rounded-xl text-xs text-[var(--color-content-main,#181124)] placeholder-[var(--color-content-muted,#a19da9)] transition-all duration-200 shadow-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white border border-[#e2e0e8] rounded-2xl shadow-2xl p-6 flex flex-col overflow-visible z-10 transition-transform scale-100">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <h3 className="text-sm font-extrabold text-[#181124] uppercase tracking-wider">
            {initialSelectedEmployee ? "Edit Leave Override" : "Create Leave Override"}
          </h3>
          <p className="text-[10px] text-gray-500 mt-1 font-medium">
            Tailor leave thresholds for the selected employee profile.
          </p>
        </div>

        {/* Local Feedback Banner */}
        {localBanner && (
          <div
            className={`mb-4 flex items-start gap-2.5 p-3 rounded-xl text-xs font-semibold border transition-all ${
              localBanner.status === "success"
                ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                : "bg-rose-50 border-rose-100 text-rose-800"
            }`}
          >
            {localBanner.status === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <span className="block font-bold">
                {localBanner.status === "success" ? "Success" : "Notice"}
              </span>
              <span className="block mt-0.5 font-medium leading-relaxed">
                {localBanner.message}
              </span>
            </div>
          </div>
        )}

        {/* Custom Styled Search Dropdown */}
        <div className="space-y-1.5 relative mb-4" ref={dropdownRef}>
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
            Select Employee
          </label>

          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={employees.length === 0}
            className={`${inputClass} pl-9 pr-8 flex items-center justify-between text-left cursor-pointer relative z-20`}
          >
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <User className="w-4 h-4" />
            </span>
            <span className="truncate pr-4">
              {selectedEmp
                ? `${selectedEmp.name} ${selectedEmp.isCustom ? "(Custom)" : "(Standard)"}`
                : "Choose an active employee..."}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#e2e0e8] rounded-xl shadow-xl max-h-48 overflow-y-auto z-[60] p-2 space-y-1.5">
              {/* Search Inside Dropdown */}
              <div className="relative sticky top-0 bg-white pb-1.5">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Type to search..."
                  value={dropdownSearch}
                  onChange={(e) => setDropdownSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-indigo-500 text-gray-700 font-medium"
                />
              </div>

              <div className="divide-y divide-gray-100">
                {filteredEmployees.length === 0 ? (
                  <div className="text-center py-4 text-[10px] text-gray-400 font-semibold">
                    No matching employees found
                  </div>
                ) : (
                  filteredEmployees.map((emp) => (
                    <button
                      key={emp.userId}
                      type="button"
                      onClick={() => handleSelectEmployee(emp)}
                      className={`w-full text-left p-2 rounded-lg hover:bg-gray-50 transition font-medium block ${
                        selectedEmp?.userId === emp.userId ? "bg-indigo-50/70" : ""
                      }`}
                    >
                      <span className="block font-bold text-xs text-gray-800">{emp.name}</span>
                      <span className="block text-[10px] text-gray-400">{emp.email}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {selectedEmp ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500">Annual Leaves</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={tempAnnual}
                  placeholder="0"
                  onChange={(e) => handleNumericInput(e.target.value, setTempAnnual)}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500">Sick Leaves</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={tempSick}
                  placeholder="0"
                  onChange={(e) => handleNumericInput(e.target.value, setTempSick)}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500">Casual Leaves</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={tempCasual}
                  placeholder="0"
                  onChange={(e) => handleNumericInput(e.target.value, setTempCasual)}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-indigo-600">Monthly Limit</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={tempMonthly}
                  placeholder="0"
                  onChange={(e) => handleNumericInput(e.target.value, setTempMonthly)}
                  className={`${inputClass} border-indigo-200 focus:border-indigo-500`}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-xs font-bold text-gray-700 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl transition cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Saving..." : "Apply Config"}</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8 text-[10px] text-gray-400 border border-dashed border-gray-200 rounded-xl font-semibold leading-relaxed">
            Please choose an active employee above to configure settings.
          </div>
        )}
      </div>
    </div>
  );
}