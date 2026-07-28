"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface FilterSelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  /** Icon rendered inside the trigger, before the selected label */
  icon?: React.ReactNode;
  options: FilterSelectOption[];
  value: string;
  onChange: (value: string) => void;
  /** Accessible name for the control (not rendered visually) */
  ariaLabel: string;
  className?: string;
}

/**
 * Compact inline select for toolbars and filter rows. Unlike the labelled
 * CustomDropdown, this renders as a single pill that lines up with inputs
 * and buttons of the same height.
 */
export function FilterSelect({
  icon,
  options,
  value,
  onChange,
  ariaLabel,
  className = "",
}: FilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Sync focused option during render (avoids a setState-in-effect cascade)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      const activeIdx = options.findIndex((opt) => opt.value === value);
      setFocusedIndex(activeIdx >= 0 ? activeIdx : 0);
    } else {
      setFocusedIndex(-1);
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const selected = options.find((opt) => opt.value === value);

  const selectOption = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % options.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + options.length) % options.length);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          selectOption(options[focusedIndex].value);
        }
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={() => setIsOpen((open) => !open)}
        className={`flex w-full items-center gap-2 px-3 py-2 bg-surface-card border rounded-xl text-xs font-semibold text-content-main shadow-sm cursor-pointer transition-all duration-150 hover:border-brand-accent/40 focus:outline-none focus:ring-2 focus:ring-brand-accent/25 focus:border-brand-accent ${
          isOpen ? "border-brand-accent ring-2 ring-brand-accent/15" : "border-line-subtle"
        }`}
      >
        {icon && <span className="text-content-muted flex items-center shrink-0">{icon}</span>}
        <span className="flex-1 text-left truncate">{selected?.label || "Select..."}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-content-muted transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-brand-accent" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 top-full mt-1.5 w-full min-w-44 z-50 max-h-60 overflow-y-auto shadow-lg border border-line-subtle rounded-xl bg-surface-card py-1"
        >
          {options.length === 0 ? (
            <div className="px-4 py-3 text-xs text-center text-content-muted">
              No options available
            </div>
          ) : (
            options.map((opt, index) => {
              const isActive = value === opt.value;
              const isFocused = focusedIndex === index;

              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => selectOption(opt.value)}
                  className={`flex w-full items-center justify-between px-3.5 py-2.5 text-xs text-left font-semibold cursor-pointer transition-colors duration-150 ${
                    isActive
                      ? "bg-brand-subtle text-brand-accent"
                      : "text-content-secondary hover:bg-brand-subtle/50 hover:text-brand-accent"
                  } ${isFocused && !isActive ? "bg-brand-subtle/35 text-brand-accent" : ""}`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isActive && <Check className="w-3.5 h-3.5 text-brand-accent shrink-0 ml-2" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
