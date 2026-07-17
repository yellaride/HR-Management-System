import React from "react";
import { X } from "lucide-react";
import { EmployeeBirthday } from "@/lib/types";

interface EmployeeModalProps {
  employee: EmployeeBirthday;
  onClose: () => void;
  getInitials: (name: string) => string;
  formatBirthdate: (day: number, monthIdx: number) => string;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  employee,
  onClose,
  getInitials,
  formatBirthdate,
}) => {
  return (
    // 1. Overlay with deep obsidian overlay color and soft blur
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-content-main/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-surface-card border border-line-subtle rounded-2xl p-6 sm:p-8 max-w-sm w-full relative space-y-6 shadow-xl animate-in zoom-in-95 duration-200">
        
        {/* 2. Sleek absolute close button with border reveal */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-content-muted hover:text-content-main hover:bg-surface-main border border-transparent hover:border-line-subtle transition-all duration-200 cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 3. Hero Avatar Section with decorative birthday indicator */}
        <div className="text-center space-y-3.5">
          <div className="relative inline-flex mx-auto">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center font-extrabold text-xl bg-brand-subtle text-brand-accent border border-brand-accent/20 shadow-xs select-none transition-transform duration-300 hover:scale-105">
              {getInitials(employee.name)}
            </div>
            <span className="absolute -bottom-1 -right-1 bg-surface-card border border-line-subtle w-7 h-7 rounded-lg flex items-center justify-center text-xs shadow-sm select-none">
              🎉
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-content-main tracking-tight">
              {employee.name}
            </h3>
            <p className="inline-flex items-center text-[10px] font-bold text-brand-accent tracking-wider uppercase px-2.5 py-1 rounded-full bg-brand-subtle/50 border border-brand-accent/15 leading-none">
              {employee.designation}
            </p>
          </div>
        </div>

        {/* 4. Details Fields structured using key value cards */}
        <div className="space-y-3.5 bg-surface-main/60 p-5 rounded-2xl border border-line-subtle text-xs">
          <div className="flex justify-between items-center gap-4 py-0.5">
            <span className="field-label text-content-muted">
              Corporate Email
            </span>
            <span 
              className="font-semibold text-content-main truncate max-w-[170px]"
              title={employee.email}
            >
              {employee.email}
            </span>
          </div>
          
          <div className="h-[1px] bg-line-subtle/50 w-full" />

          <div className="flex justify-between items-center gap-4 py-0.5">
            <span className="field-label text-content-muted">
              Department
            </span>
            <span className="font-semibold text-content-main">
              {employee.department}
            </span>
          </div>

          <div className="h-[1px] bg-line-subtle/50 w-full" />

          <div className="flex justify-between items-center gap-4 py-0.5">
            <span className="field-label text-content-muted">
              Celebration Date
            </span>
            <span className="font-bold text-brand-accent">
              {formatBirthdate(employee.birthDay, employee.birthMonth)} (Age: {2026 - parseInt(employee.birthDate.split("-")[0])})
            </span>
          </div>
        </div>

        {/* 5. Action Panel conforming to default standard brand style */}
        <div className="flex pt-1">
          <button
            type="button"
            onClick={onClose}
            className="btn-brand-filled w-full text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md shadow-brand-accent/10"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
};