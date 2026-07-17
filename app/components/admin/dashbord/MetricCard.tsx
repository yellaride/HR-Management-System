import React from "react";

import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: number;
  icon?: LucideIcon;
  /** Allows passing emoji/text icons without touching the card layout */
  iconText?: string;
  iconBgClass?: string;
  iconColorClass?: string;
  subtext?: string;
  children?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  icon: Icon,
  iconText,
  iconBgClass = "bg-[var(--color-brand-subtle)]/40",
  iconColorClass = "text-[var(--color-brand-accent)] border-[var(--color-brand-subtle)]/50",
  subtext,
  children,
}) => {
  return (
    <div className="panel flex items-center justify-between p-6">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-content-muted)]">
          {label}
        </p>
        <h3 className="text-3xl font-extrabold mt-1.5 text-[var(--color-content-main)]">
          {value}
        </h3>
        {subtext ? (
          <p className="text-[11px] text-[var(--color-content-secondary)] mt-1 font-semibold">
            {subtext}
          </p>
        ) : null}
        {children}
      </div>

      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-xs select-none ${
          iconBgClass || "bg-[var(--color-brand-subtle)]/40"
        } ${iconColorClass || "text-[var(--color-brand-accent)] border-[var(--color-brand-subtle)]/50"} border`}
      >
        {Icon ? <Icon className="w-6 h-6" /> : iconText ? <span aria-hidden>{iconText}</span> : null}
      </div>
    </div>
  );
};
