"use client";

import React from "react";
import { Clock } from "lucide-react";

interface StandardWorkingHoursSettingsProps {
  isEditing: boolean;
  saving: boolean;
  value: number;
  tempValue: number;
  onChangeTempValue: (next: number) => void;
}

export default function StandardWorkingHoursSettings({
  isEditing,
  saving,
  value,
  tempValue,
  onChangeTempValue,
}: StandardWorkingHoursSettingsProps) {
  return (
    <div className="space-y-1">
      <span className="field-label block">Standard Working Hours</span>

      {!isEditing ? (
        <div className="text-sm font-semibold text-[var(--color-content-main)] flex items-center gap-2 mt-0.5">
          <Clock className="w-3.5 h-3.5 text-[var(--color-content-muted)]" />
          {typeof value === "number" ? value : 0}
          <span className="text-xs font-medium text-[var(--color-content-secondary)]">hours / year</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 mt-0.5">
          <input
            type="number"
            min={0}
            step={1}
            required
            value={Number.isFinite(tempValue) ? tempValue : 0}
            disabled={saving}
            onChange={(e) => {
              const raw = e.target.value;
              const next = raw === "" ? 0 : Number.parseInt(raw, 10);
              onChangeTempValue(Number.isFinite(next) ? next : 0);
            }}

            className="form-input text-xs"
          />
          <span className="text-xs font-medium text-[var(--color-content-secondary)]">hours / year</span>
        </div>
      )}
    </div>
  );
}

