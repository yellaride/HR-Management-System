interface Rgb {
  r: number;
  g: number;
  b: number;
}

interface Rgba extends Rgb {
  a: number;
}

export interface RemoveImageBackgroundOptions {
  /** Color distance (0–255) treated as background. Default 42 */
  tolerance?: number;
  /** Feather edge in color-distance units. Default 14 */
  softEdge?: number;
}

function getPixel(data: Uint8ClampedArray, width: number, x: number, y: number): Rgba {
  const i = (y * width + x) * 4;
  return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
}

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function averageRgb(colors: Rgb[]): Rgb {
  const total = colors.length;
  return {
    r: Math.round(colors.reduce((sum, c) => sum + c.r, 0) / total),
    g: Math.round(colors.reduce((sum, c) => sum + c.g, 0) / total),
    b: Math.round(colors.reduce((sum, c) => sum + c.b, 0) / total),
  };
}

function sampleBackgroundColor(
  data: Uint8ClampedArray,
  width: number,
  height: number
): Rgb | null {
  const margin = Math.max(1, Math.floor(Math.min(width, height) * 0.02));
  const samplePoints: [number, number][] = [];

  for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 16))) {
    samplePoints.push([x, margin], [x, height - 1 - margin]);
  }
  for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 16))) {
    samplePoints.push([margin, y], [width - 1 - margin, y]);
  }

  const samples: Rgb[] = [];
  for (const [x, y] of samplePoints) {
    const pixel = getPixel(data, width, x, y);
    if (pixel.a > 200) {
      samples.push({ r: pixel.r, g: pixel.g, b: pixel.b });
    }
  }

  if (samples.length < 4) return null;
  return averageRgb(samples);
}

function hasSignificantTransparency(data: Uint8ClampedArray): boolean {
  let transparent = 0;
  const total = data.length / 4;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 240) transparent++;
  }
  return transparent / total > 0.06;
}

function canvasToPngFile(canvas: HTMLCanvasElement, fileName: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not process image."));
          return;
        }
        const baseName = fileName.replace(/\.[^.]+$/, "") || "payslip-logo";
        resolve(new File([blob], `${baseName}.png`, { type: "image/png" }));
      },
      "image/png",
      1
    );
  });
}

/**
 * Removes a solid/light background (sampled from image edges) and returns a PNG.
 * Skips processing when the image already has meaningful transparency.
 */
export async function removeImageBackground(
  file: File,
  options: RemoveImageBackgroundOptions = {}
): Promise<File> {
  if (typeof document === "undefined") return file;

  const tolerance = options.tolerance ?? 42;
  const softEdge = options.softEdge ?? 14;

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;

  if (hasSignificantTransparency(data)) {
    if (file.type === "image/png") return file;
    return canvasToPngFile(canvas, file.name);
  }

  const background = sampleBackgroundColor(data, width, height);
  if (!background) {
    if (file.type === "image/png") return file;
    return canvasToPngFile(canvas, file.name);
  }

  for (let i = 0; i < data.length; i += 4) {
    const pixel: Rgb = { r: data[i], g: data[i + 1], b: data[i + 2] };
    const distance = colorDistance(pixel, background);

    if (distance <= tolerance) {
      data[i + 3] = 0;
    } else if (distance <= tolerance + softEdge) {
      const factor = (distance - tolerance) / softEdge;
      data[i + 3] = Math.round(data[i + 3] * factor);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvasToPngFile(canvas, file.name);
}

/** Checkerboard preview so transparent logos are visible in settings UI */
export const LOGO_TRANSPARENT_PREVIEW_CLASS =
  "bg-white bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%,transparent_75%,#e2e8f0_75%,#e2e8f0),linear-gradient(45deg,#e2e8f0_25%,transparent_25%,transparent_75%,#e2e8f0_75%,#e2e8f0)] [background-size:10px_10px] [background-position:0_0,5px_5px]";
