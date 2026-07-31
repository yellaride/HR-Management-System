"use client";

import React, { useEffect, useRef, useState } from "react";
import { Move, RotateCcw, ZoomIn } from "lucide-react";
import {
  clampPayslipLogoAdjust,
  DEFAULT_PAYSLIP_LOGO_ADJUST,
  PAYSLIP_LOGO_PREVIEW_PX,
  PayslipLogoAdjust,
  renderAdjustedPayslipLogo,
} from "@/lib/payslipLogoAdjust";
import { LOGO_TRANSPARENT_PREVIEW_CLASS } from "@/lib/removeImageBackground";

interface LogoAdjustEditorProps {
  imageUrl: string;
  adjust: PayslipLogoAdjust;
  onChange: (adjust: PayslipLogoAdjust) => void;
  disabled?: boolean;
}

export default function LogoAdjustEditor({
  imageUrl,
  adjust,
  onChange,
  disabled = false,
}: LogoAdjustEditorProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    let cancelled = false;
    renderAdjustedPayslipLogo(
      imageUrl,
      adjust,
      PAYSLIP_LOGO_PREVIEW_PX.width,
      PAYSLIP_LOGO_PREVIEW_PX.height
    ).then((url) => {
      if (!cancelled) setPreviewUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [imageUrl, adjust]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    setDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: adjust.offsetX,
      offsetY: adjust.offsetY,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || disabled) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    onChange(
      clampPayslipLogoAdjust({
        ...adjust,
        offsetX: dragStart.current.offsetX + dx,
        offsetY: dragStart.current.offsetY + dy,
      })
    );
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleReset = () => onChange({ ...DEFAULT_PAYSLIP_LOGO_ADJUST });

  const isDefault =
    adjust.scale === DEFAULT_PAYSLIP_LOGO_ADJUST.scale &&
    adjust.offsetX === DEFAULT_PAYSLIP_LOGO_ADJUST.offsetX &&
    adjust.offsetY === DEFAULT_PAYSLIP_LOGO_ADJUST.offsetY;

  return (
    <div className="space-y-3 rounded-xl border border-line-subtle bg-surface-subtle/40 p-3">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-content-muted">
        <Move className="w-3 h-3" />
        Adjust logo on payslip
      </div>

      <div
        role="img"
        aria-label="Payslip logo preview — drag to reposition"
        className={`relative overflow-hidden rounded-lg border border-line-subtle shadow-inner ${LOGO_TRANSPARENT_PREVIEW_CLASS} ${
          disabled ? "opacity-50 pointer-events-none" : dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          width: PAYSLIP_LOGO_PREVIEW_PX.width,
          height: PAYSLIP_LOGO_PREVIEW_PX.height,
          maxWidth: "100%",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt=""
            className="h-full w-full select-none pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-content-muted">
            Loading preview…
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-line-subtle/70" />
      </div>

      <p className="text-[10px] leading-relaxed text-content-muted">
        Drag to move the logo. Use the zoom slider to resize it within the payslip header area.
      </p>

      <div className="flex items-center gap-3">
        <ZoomIn className="h-3.5 w-3.5 shrink-0 text-content-muted" />
        <input
          type="range"
          min={50}
          max={200}
          step={5}
          value={Math.round(adjust.scale * 100)}
          disabled={disabled}
          onChange={(e) =>
            onChange(
              clampPayslipLogoAdjust({
                ...adjust,
                scale: Number(e.target.value) / 100,
              })
            )
          }
          className="h-1.5 flex-1 cursor-pointer accent-brand-accent disabled:cursor-not-allowed"
        />
        <span className="w-10 text-right text-[10px] font-bold text-content-secondary">
          {Math.round(adjust.scale * 100)}%
        </span>
      </div>

      <button
        type="button"
        onClick={handleReset}
        disabled={disabled || isDefault}
        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-content-secondary hover:text-brand-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
      >
        <RotateCcw className="h-3 w-3" />
        Reset position &amp; zoom
      </button>
    </div>
  );
}
