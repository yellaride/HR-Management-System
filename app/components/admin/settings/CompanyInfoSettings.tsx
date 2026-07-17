"use client";

import React, { useState } from "react";
import { Building, Edit2, X, CheckCircle2, Loader2 } from "lucide-react";

interface CompanyInfoData {
  companyName: string;
  location: string;
  phone: string;
  email: string;
  standardWorkingHours: number;
}

interface CompanyInfoSettingsProps {
  data: CompanyInfoData;
  onSave: (updatedData: Partial<CompanyInfoData>) => Promise<void>;
}

export default function CompanyInfoSettings({ data, onSave }: CompanyInfoSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tempData, setTempData] = useState<CompanyInfoData>({ ...data });

  const handleStartEditing = () => {
    setTempData({ ...data });
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setTempData({ ...data });
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSave(tempData);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel bg-white border border-[var(--color-line-subtle)] rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-[var(--color-line-subtle)]">
        <div className="flex items-center gap-2">
          <Building className="w-5 h-5 text-[var(--color-brand-accent)]" />
          <h3 className="text-sm font-bold text-[var(--color-content-main)]">Corporate Information</h3>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={handleStartEditing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-brand-subtle)] hover:bg-[var(--color-brand-accent)] hover:text-white text-[var(--color-brand-accent)] text-xs font-bold rounded-lg transition cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Details</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelEditing}
              disabled={saving}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[var(--color-surface-main)] hover:bg-[var(--color-line-subtle)] text-[var(--color-content-secondary)] text-xs font-bold rounded-lg transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-hover)] disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>{saving ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        )}
      </div>

      <div className="mt-4">
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-content-secondary)]">Company Name</label>
              <input
                type="text"
                required
                value={tempData.companyName}
                onChange={(e) => setTempData({ ...tempData, companyName: e.target.value })}
                className="form-input text-xs w-full p-2 border border-[var(--color-line-subtle)] rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-content-secondary)]">Location</label>
              <input
                type="text"
                value={tempData.location}
                onChange={(e) => setTempData({ ...tempData, location: e.target.value })}
                className="form-input text-xs w-full p-2 border border-[var(--color-line-subtle)] rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-content-secondary)]">Contact Phone</label>
              <input
                type="text"
                value={tempData.phone}
                onChange={(e) => setTempData({ ...tempData, phone: e.target.value })}
                className="form-input text-xs w-full p-2 border border-[var(--color-line-subtle)] rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-content-secondary)]">Company Email</label>
              <input
                type="email"
                value={tempData.email}
                onChange={(e) => setTempData({ ...tempData, email: e.target.value })}
                className="form-input text-xs w-full p-2 border border-[var(--color-line-subtle)] rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-content-secondary)]">Monthly Work Hours</label>
              <input
                type="number"
                min={0}
                value={tempData.standardWorkingHours}
                onChange={(e) => setTempData({ ...tempData, standardWorkingHours: Number(e.target.value) || 0 })}
                className="form-input text-xs w-full p-2 border border-[var(--color-line-subtle)] rounded-lg"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-2">
            <div>
              <span className="text-xs font-semibold text-[var(--color-content-secondary)]">Company Name</span>
              <span className="text-sm font-semibold text-[var(--color-content-main)] block mt-0.5">{data.companyName || "N/A"}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-[var(--color-content-secondary)]">Location</span>
              <span className="text-sm font-semibold text-[var(--color-content-main)] block mt-0.5">{data.location || "N/A"}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-[var(--color-content-secondary)]">Contact Phone</span>
              <span className="text-sm font-semibold text-[var(--color-content-main)] block mt-0.5">{data.phone || "N/A"}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-[var(--color-content-secondary)]">Company Email</span>
              <span className="text-sm font-semibold text-[var(--color-content-main)] block mt-0.5">{data.email || "N/A"}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-[var(--color-content-secondary)]">Standard Working Hours</span>
              <span className="text-sm font-semibold text-[var(--color-content-main)] block mt-0.5">{data.standardWorkingHours} hours/month</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}