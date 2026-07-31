export interface PayslipLogoAdjust {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export const DEFAULT_PAYSLIP_LOGO_ADJUST: PayslipLogoAdjust = {
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

/** Payslip PDF header logo slot (mm) */
export const PAYSLIP_LOGO_FRAME_MM = { width: 42, height: 14 };

/** Settings preview frame (px) — same aspect ratio as PDF slot */
export const PAYSLIP_LOGO_PREVIEW_PX = { width: 210, height: 70 };

/** High-res canvas for crisp PDF embedding */
export const PAYSLIP_LOGO_PDF_RENDER_PX = { width: 420, height: 140 };

export function clampPayslipLogoAdjust(adjust: Partial<PayslipLogoAdjust>): PayslipLogoAdjust {
  return {
    scale: Math.min(3, Math.max(0.5, adjust.scale ?? DEFAULT_PAYSLIP_LOGO_ADJUST.scale)),
    offsetX: Math.min(80, Math.max(-80, adjust.offsetX ?? DEFAULT_PAYSLIP_LOGO_ADJUST.offsetX)),
    offsetY: Math.min(40, Math.max(-40, adjust.offsetY ?? DEFAULT_PAYSLIP_LOGO_ADJUST.offsetY)),
  };
}

export function parsePayslipLogoAdjust(source?: Partial<PayslipLogoAdjust> | null): PayslipLogoAdjust {
  return clampPayslipLogoAdjust({
    scale: typeof source?.scale === "number" ? source.scale : DEFAULT_PAYSLIP_LOGO_ADJUST.scale,
    offsetX: typeof source?.offsetX === "number" ? source.offsetX : DEFAULT_PAYSLIP_LOGO_ADJUST.offsetX,
    offsetY: typeof source?.offsetY === "number" ? source.offsetY : DEFAULT_PAYSLIP_LOGO_ADJUST.offsetY,
  });
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Render logo with zoom/pan into a fixed frame (object-contain + transform). */
export async function renderAdjustedPayslipLogo(
  imageUrl: string,
  adjust: PayslipLogoAdjust,
  frameWidth: number,
  frameHeight: number
): Promise<string | null> {
  if (typeof document === "undefined") return null;

  try {
    const settings = clampPayslipLogoAdjust(adjust);
    const img = await loadHtmlImage(imageUrl);
    const canvas = document.createElement("canvas");
    canvas.width = frameWidth;
    canvas.height = frameHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.clearRect(0, 0, frameWidth, frameHeight);

    const frameAspect = frameWidth / frameHeight;
    const imgAspect = img.naturalWidth / img.naturalHeight;

    let baseW: number;
    let baseH: number;
    if (imgAspect > frameAspect) {
      baseW = frameWidth;
      baseH = frameWidth / imgAspect;
    } else {
      baseH = frameHeight;
      baseW = frameHeight * imgAspect;
    }

    const drawW = baseW * settings.scale;
    const drawH = baseH * settings.scale;
    const x = (frameWidth - drawW) / 2 + settings.offsetX;
    const y = (frameHeight - drawH) / 2 + settings.offsetY;

    ctx.drawImage(img, x, y, drawW, drawH);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}
