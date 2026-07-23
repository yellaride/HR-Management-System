"use client";

import React, { useRef, useState, useCallback } from "react";
import { Camera, Trash2, Loader2, ZoomIn, ZoomOut, X, Check, Move } from "lucide-react";

interface ProfilePhotoUploaderProps {
  photoUrl: string;
  initials: string;
  uploading: boolean;
  onPhotoSelected: (file: File) => void;
  onRemovePhoto: () => void;
}

export default function ProfilePhotoUploader({
  photoUrl,
  initials,
  uploading,
  onPhotoSelected,
  onRemovePhoto,
}: ProfilePhotoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Crop Modal States
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleAvatarClick = () => {
    if (uploading) return;
    if (photoUrl) {
      onRemovePhoto();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImageSrc(reader.result as string);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Mouse & Touch Drag Handlers
  const startDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX - pan.x, y: clientY - pan.y });
  };

  const onDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) return;
      setPan({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const endDrag = () => {
    setIsDragging(false);
  };

  // Crop Canvas Output Generation
  const handleCropAndSave = async () => {
    if (!selectedImageSrc || !imgRef.current) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const outputSize = 400; // Output image size in pixels
    canvas.width = outputSize;
    canvas.height = outputSize;

    const img = imgRef.current;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    const viewportSize = 256; // Matching w-64 h-64 (256px)
    const scaleRatio = outputSize / viewportSize;

    const aspect = naturalWidth / naturalHeight;

    // Determine viewport render dimensions matching max-w-full / max-h-full
    let baseRenderWidth = viewportSize;
    let baseRenderHeight = viewportSize;

    if (aspect >= 1) {
      baseRenderHeight = viewportSize / aspect;
    } else {
      baseRenderWidth = viewportSize * aspect;
    }

    // Scale to output canvas size
    const drawWidth = baseRenderWidth * scaleRatio;
    const drawHeight = baseRenderHeight * scaleRatio;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outputSize, outputSize);

    ctx.save();
    // Translate origin to canvas center
    ctx.translate(outputSize / 2, outputSize / 2);
    // Apply scaled pan offsets
    ctx.translate(pan.x * scaleRatio, pan.y * scaleRatio);
    // Apply zoom
    ctx.scale(zoom, zoom);

    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const croppedFile = new File([blob], "profile-photo.jpg", { type: "image/jpeg" });
        onPhotoSelected(croppedFile);
        setCropModalOpen(false);
        setSelectedImageSrc(null);
      },
      "image/jpeg",
      0.92
    );
  };

  return (
    <div className="flex flex-col items-center">
      {/* Avatar Container */}
      <div
        className="relative group rounded-full cursor-pointer select-none"
        onClick={handleAvatarClick}
        title={photoUrl ? "Click to remove photo" : "Click to upload photo"}
      >
        <div className="h-28 w-28 rounded-full border-2 border-line-subtle bg-surface-main flex items-center justify-center overflow-hidden shadow-inner relative transition duration-150 group-hover:ring-2 group-hover:ring-brand-accent/20">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Profile"
              className="h-full w-full object-cover object-center transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <span className="text-brand-accent font-extrabold text-xl tracking-wider">
              {initials}
            </span>
          )}

          {/* Hover Overlay */}
          {photoUrl ? (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-full">
              <Trash2 className="w-5 h-5 mb-0.5 text-rose-400" />
              <span className="text-[9px] font-bold tracking-wide uppercase text-rose-300">
                Remove Photo
              </span>
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-full">
              <Camera className="w-5 h-5 mb-0.5" />
              <span className="text-[9px] font-bold tracking-wide uppercase">
                Upload Photo
              </span>
            </div>
          )}

          {/* Loading Overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-content-main/80 flex flex-col items-center justify-center text-white rounded-full">
              <Loader2 className="w-5 h-5 animate-spin text-brand-accent" />
            </div>
          )}
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />

      {/* Interactive Crop Modal */}
      {cropModalOpen && selectedImageSrc && (
        <div className="fixed inset-0 bg-content-main/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-card border border-line-subtle rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-line-subtle">
              <div>
                <h3 className="text-sm font-bold text-content-main">Adjust Photo</h3>
                <p className="text-[11px] text-content-muted mt-0.5">
                  Drag image to reposition & use slider to zoom.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                className="p-1 rounded-lg text-content-muted hover:text-content-main hover:bg-surface-main transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Circular Crop Viewport Box */}
            <div
              className="w-64 h-64 mx-auto relative rounded-full overflow-hidden border-2 border-brand-accent cursor-grab active:cursor-grabbing bg-surface-main select-none touch-none shadow-inner"
              onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
              onMouseMove={(e) => onDrag(e.clientX, e.clientY)}
              onMouseUp={endDrag}
              onMouseLeave={endDrag}
              onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchMove={(e) => onDrag(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchEnd={endDrag}
            >
              <img
                ref={imgRef}
                src={selectedImageSrc}
                alt="Crop preview"
                className="absolute max-w-none pointer-events-none transition-transform duration-75"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  maxHeight: "100%",
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-white/40">
                <Move className="w-6 h-6 opacity-30" />
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-content-secondary font-medium">
                <span>Zoom Scale</span>
                <span>{Math.round(zoom * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <ZoomOut className="w-4 h-4 text-content-muted shrink-0" />
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-brand-accent cursor-pointer"
                />
                <ZoomIn className="w-4 h-4 text-content-muted shrink-0" />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line-subtle">
              <button
                type="button"
                onClick={() => setCropModalOpen(false)}
                className="px-4 py-2 border border-line-subtle rounded-xl text-xs font-semibold text-content-secondary hover:bg-surface-main transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropAndSave}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-accent hover:bg-brand-hover text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save & Upload</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}