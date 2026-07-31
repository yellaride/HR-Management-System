"use client";

import React, { useEffect, useRef, useState } from "react";
import { ImageIcon, Upload, X, Loader2, CheckCircle2, Edit2 } from "lucide-react";
import LogoAdjustEditor from "@/app/components/admin/settings/LogoAdjustEditor";
import {
  DEFAULT_PAYSLIP_LOGO_ADJUST,
  PAYSLIP_LOGO_PREVIEW_PX,
  parsePayslipLogoAdjust,
  PayslipLogoAdjust,
  renderAdjustedPayslipLogo,
} from "@/lib/payslipLogoAdjust";
import { LOGO_TRANSPARENT_PREVIEW_CLASS, removeImageBackground } from "@/lib/removeImageBackground";

export interface PayslipBrandingData {
  companyLogoUrl: string;
  companyLogoScale: number;
  companyLogoOffsetX: number;
  companyLogoOffsetY: number;
}

interface PayslipBrandingSettingsProps {
  data: PayslipBrandingData;
  onSave: (updated: Partial<PayslipBrandingData>) => Promise<void>;
}

function toLogoAdjust(data: Pick<PayslipBrandingData, "companyLogoScale" | "companyLogoOffsetX" | "companyLogoOffsetY">): PayslipLogoAdjust {
  return parsePayslipLogoAdjust({
    scale: data.companyLogoScale,
    offsetX: data.companyLogoOffsetX,
    offsetY: data.companyLogoOffsetY,
  });
}

function brandingWithAdjust(
  base: PayslipBrandingData,
  adjust: PayslipLogoAdjust
): PayslipBrandingData {
  return {
    ...base,
    companyLogoScale: adjust.scale,
    companyLogoOffsetX: adjust.offsetX,
    companyLogoOffsetY: adjust.offsetY,
  };
}

function AdjustedLogoPreview({
  logoUrl,
  adjust,
}: {
  logoUrl: string;
  adjust: PayslipLogoAdjust;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    renderAdjustedPayslipLogo(
      logoUrl,
      adjust,
      PAYSLIP_LOGO_PREVIEW_PX.width,
      PAYSLIP_LOGO_PREVIEW_PX.height
    ).then((url) => {
      if (!cancelled) setPreviewUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [logoUrl, adjust]);

  if (!previewUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center text-[10px] text-content-muted">
        Loading…
      </div>
    );
  }

  return (
    <img
      src={previewUrl}
      alt="Company logo"
      className="h-full w-full object-contain p-1"
    />
  );
}

export default function PayslipBrandingSettings({ data, onSave }: PayslipBrandingSettingsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<"idle" | "processing" | "uploading">("idle");
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
    setUploadStage("processing");
    try {
      const processedFile = await removeImageBackground(file);

      setUploadStage("uploading");
      const formData = new FormData();
      formData.append("file", processedFile);
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

      setTemp((prev) =>
        brandingWithAdjust(
          { ...prev, companyLogoUrl: body.secure_url! },
          { ...DEFAULT_PAYSLIP_LOGO_ADJUST }
        )
      );
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Could not upload image.");
    } finally {
      setUploading(false);
      setUploadStage("idle");
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

  const handleAdjustChange = (adjust: PayslipLogoAdjust) => {
    setTemp((prev) => brandingWithAdjust(prev, adjust));
  };

  const handleRemoveLogo = () => {
    setTemp((prev) =>
      brandingWithAdjust({ ...prev, companyLogoUrl: "" }, { ...DEFAULT_PAYSLIP_LOGO_ADJUST })
    );
  };

  const display = isEditing ? temp : data;
  const logoUrl = display.companyLogoUrl;
  const logoAdjust = toLogoAdjust(display);

  return (
    <div className="panel bg-white border border-line-subtle rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-line-subtle">
        <div>
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-brand-accent" />
            <h3 className="text-sm font-bold text-content-main">Payslip Logo</h3>
          </div>
          <p className="text-[11px] text-content-secondary mt-1 max-w-xl">
            Upload your company logo once. Solid backgrounds are removed automatically on upload.
            After upload, drag and zoom to fit the payslip header area.
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

      <div className="mt-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div
            className={`relative border-2 border-dashed border-line-subtle rounded-xl flex items-center justify-center overflow-hidden w-full sm:w-[210px] shrink-0 ${LOGO_TRANSPARENT_PREVIEW_CLASS}`}
            style={{ height: PAYSLIP_LOGO_PREVIEW_PX.height }}
          >
            {logoUrl ? (
              <AdjustedLogoPreview logoUrl={logoUrl} adjust={logoAdjust} />
            ) : (
              <span className="text-[10px] text-content-muted text-center px-3 leading-relaxed">
                PNG / JPG / WebP — background removed on upload
              </span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-[11px] text-content-secondary leading-relaxed">
              JPG, PNG, or WebP — white/solid backgrounds are removed on upload. Transparent PNGs
              work best. If no logo is uploaded, the company name from Company Info is used instead.
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
                  {uploadStage === "processing"
                    ? "Removing background…"
                    : uploadStage === "uploading"
                      ? "Uploading…"
                      : "Upload Logo"}
                </button>
                {temp.companyLogoUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {isEditing && temp.companyLogoUrl && (
          <LogoAdjustEditor
            imageUrl={temp.companyLogoUrl}
            adjust={logoAdjust}
            onChange={handleAdjustChange}
            disabled={uploading || saving}
          />
        )}
      </div>

      {!isEditing && !data.companyLogoUrl && (
        <p className="mt-4 text-[11px] text-content-muted italic">
          No logo uploaded yet. Payslip PDFs will use the company name from Company Info.
        </p>
      )}
    </div>
  );
}
