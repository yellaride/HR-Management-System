import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  label: string;
  icon: React.ReactNode;
  options: Option[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  icon,
  options,
  selectedValue,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Sync focused index during the render phase to avoid layout thrashing and cascading updates
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevSelectedValue, setPrevSelectedValue] = useState(selectedValue);
  const [prevOptions, setPrevOptions] = useState(options);

  if (isOpen !== prevIsOpen || selectedValue !== prevSelectedValue || options !== prevOptions) {
    setPrevIsOpen(isOpen);
    setPrevSelectedValue(selectedValue);
    setPrevOptions(options);

    if (isOpen) {
      const activeIdx = options.findIndex((opt) => opt.value === selectedValue);
      setFocusedIndex(activeIdx >= 0 ? activeIdx : 0);
    } else {
      setFocusedIndex(-1);
    }
  }

  // Click-outside tracking effect (retained because it integrates with a browser/external system)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const currentSelection = options.find((opt) => opt.value === selectedValue);

  // Keyboard navigation handler complying with WAI-ARIA standards
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
          onSelect(options[focusedIndex].value);
          setIsOpen(false);
          triggerRef.current?.focus();
        }
        break;
      case "Tab":
        // Allow native tab behavior to close panel naturally
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-2.5 relative w-full sm:w-auto"
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
    >
      {/* 1. Field Label */}
      <span className="field-label flex items-center gap-1.5 shrink-0 text-content-secondary font-bold select-none whitespace-nowrap">
        {icon && <span className="text-brand-accent/80 flex items-center shrink-0">{icon}</span>}
        {label}
      </span>

      <div className="relative w-full sm:w-52">
        {/* 2. Styled Dropdown Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          className={`dropdown-trigger flex items-center justify-between font-semibold transition-all duration-200 hover:border-brand-accent/40 focus:ring-2 focus:ring-brand-accent/25 focus:border-brand-accent text-content-main bg-surface-card ${
            isOpen ? "border-brand-accent ring-2 ring-brand-accent/15" : ""
          } min-h-[44px]`}
        >
          <span className="pr-2 flex-1 text-left overflow-hidden whitespace-nowrap text-ellipsis leading-none">
            {currentSelection?.label || "Select..."}
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-content-muted transition-transform duration-300 shrink-0 ${
              isOpen ? "rotate-180 text-brand-accent" : ""
            }`}
          />
        </button>

        {/* 3. Dropdown Panel & Options List */}
        {isOpen && (
          <div 
            className="dropdown-panel absolute left-0 top-full mt-1.5 w-full z-50 max-h-60 overflow-y-auto vertical-slider-reset shadow-lg border border-line-subtle rounded-xl bg-surface-card py-1 animate-in fade-in duration-200 origin-top"
            role="listbox"
          >
            {options.length === 0 ? (
              <div className="px-4 py-3 text-xs text-center text-content-muted">
                No options available
              </div>
            ) : (
              options.map((opt, index) => {
                const isActive = selectedValue === opt.value;
                const isFocused = focusedIndex === index;
                
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      onSelect(opt.value);
                      setIsOpen(false);
                      triggerRef.current?.focus();
                    }}
                    className={`dropdown-option flex items-center justify-between px-4 py-2.5 text-xs text-left font-semibold transition-all duration-150 ${
                      isActive
                        ? "dropdown-option-active bg-brand-subtle text-brand-accent"
                        : "text-content-secondary hover:bg-brand-subtle/50 hover:text-brand-accent"
                    } ${
                      isFocused && !isActive
                        ? "bg-brand-subtle/35 text-brand-accent ring-1 ring-inset ring-brand-accent/10"
                        : ""
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isActive && (
                      <Check className="w-3.5 h-3.5 text-brand-accent shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};