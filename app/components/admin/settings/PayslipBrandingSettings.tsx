"use client";

import React, { useRef, useState } from "react";
import { ImageIcon, Upload, X, Loader2, CheckCircle2, Edit2 } from "lucide-react";

export interface PayslipBrandingData {
  companyLogoUrl: string;
}

interface PayslipBrandingSettingsProps {
  data: PayslipBrandingData;
  onSave: (updated: Partial<PayslipBrandingData>) => Promise<void>;
}

export default function PayslipBrandingSettings({ data, onSave }: PayslipBrandingSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [temp, setTemp] = useState<PayslipBrandingData>({ ...data });
  const logoInputRef = useRef<HTMLInputElement>(null);

  const startEditing = () => {
    setTemp({ ...data });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setTemp({ ...data });
    setIsEditing(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "logo");

      const res = await fetch("/api/settings/payslip-branding/upload", {
        method: "POST",
        body: formData,
      });

      const body = (await res.json().catch(() => ({}))) as {
        secure_url?: string;
        error?: string;
      };

      if (!res.ok || !body.secure_url) {
        throw new Error(body.error || "Upload failed.");
      }

      setTemp({ companyLogoUrl: body.secure_url! });
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Could not upload image.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(temp);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const logoUrl = isEditing ? temp.companyLogoUrl : data.companyLogoUrl;

  return (
    <div className="panel bg-white border border-line-subtle rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-line-subtle">
        <div>
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-brand-accent" />
            <h3 className="text-sm font-bold text-content-main">Payslip Logo</h3>
          </div>
          <p className="text-[11px] text-content-secondary mt-1 max-w-xl">
            Upload your company logo once. It replaces the company name on every payslip PDF header.
            Signature and stamp areas on the PDF are left blank for manual signing.
          </p>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={startEditing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-subtle hover:bg-brand-accent hover:text-white text-brand-accent text-xs font-bold rounded-lg transition cursor-pointer shrink-0"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Configure</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={cancelEditing}
              disabled={saving || uploading}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-surface-main hover:bg-line-subtle text-content-secondary text-xs font-bold rounded-lg transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || uploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-accent hover:bg-brand-hover disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>{saving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        )}
      </div>

      <div className="mt-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="relative border-2 border-dashed border-line-subtle rounded-xl bg-surface-subtle/50 flex items-center justify-center overflow-hidden h-20 w-full sm:w-64">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Company logo"
                className="max-h-full max-w-full object-contain p-2"
              />
            ) : (
              <span className="text-[10px] text-content-muted text-center px-3 leading-relaxed">
                PNG / JPG / WebP — shown on payslip instead of company name
              </span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-[11px] text-content-secondary leading-relaxed">
              Recommended: horizontal logo on transparent background, at least 400×120 px.
              If no logo is uploaded, the company name from Company Info is used instead.
            </p>
            {isEditing && (
              <div className="flex flex-wrap gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-lg border border-line-subtle bg-surface-main hover:bg-brand-subtle text-content-secondary transition cursor-pointer disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Upload className="w-3 h-3" />
                  )}
                  Upload Logo
                </button>
                {temp.companyLogoUrl && (
                  <button
                    type="button"
                    onClick={() => setTemp({ companyLogoUrl: "" })}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {!isEditing && !data.companyLogoUrl && (
        <p className="mt-4 text-[11px] text-content-muted italic">
          No logo uploaded yet. Payslip PDFs will use the company name from Company Info.
        </p>
      )}
    </div>
  );
}
