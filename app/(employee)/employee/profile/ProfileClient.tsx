"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import Swal from "sweetalert2";
import {
  User,
  Trash2,
  ShieldAlert,
  Loader2,
  Edit2,
  CheckCircle,
  X,
  MapPin,
  HeartHandshake,
  Camera,
  ChevronDown
} from "lucide-react";

type ProfileState = {
  fullName: string;
  email: string;
  profilePhotoUrl: string;
  phoneNumber: string;
  address: string;
  dateOfBirth: string; // yyyy-mm-dd
  gender: string;
  maritalStatus: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
};

// Obsidian-Amethyst SweetAlert configurations matching custom design tokens
const swalCustomClass = {
  popup: "bg-white rounded-2xl border border-[var(--color-line-subtle)] shadow-xl font-sans",
  title: "text-sm font-bold text-[var(--color-content-main)]",
  htmlContainer: "text-xs text-[var(--color-content-secondary)]",
  confirmButton: "px-4.5 py-2.5 text-xs font-bold rounded-xl text-white bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-hover)] border-none outline-none cursor-pointer transition",
};

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  },
});

function getCloudinaryConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  return {
    cloudName,
    uploadPreset,
  };
}

async function uploadToCloudinary(file: File): Promise<string> {
  const { cloudName, uploadPreset } = getCloudinaryConfig();

  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Missing Cloudinary configuration parameters. Set up environment variables."
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Cloudinary upload failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) {
    throw new Error("Cloudinary upload succeeded but no secure_url was returned");
  }
  return data.secure_url;
}

export default function ProfileClient() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const genderRef = useRef<HTMLDivElement>(null);
  const maritalRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileState>({
    fullName: "",
    email: "",
    profilePhotoUrl: "",
    phoneNumber: "",
    address: "",
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });

  // Temporary state for editing session
  const [tempProfile, setTempProfile] = useState<ProfileState>({ ...profile });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Dropdown States
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [isMaritalOpen, setIsMaritalOpen] = useState(false);

  // Password Modification States
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Close dropdown overlay menus on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (genderRef.current && !genderRef.current.contains(target)) {
        setIsGenderOpen(false);
      }
      if (maritalRef.current && !maritalRef.current.contains(target)) {
        setIsMaritalOpen(false);
      }
    }

    if (isGenderOpen || isMaritalOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isGenderOpen, isMaritalOpen]);

  // Strip non-numerical entries
  const sanitizeNumbersOnly = (value: string) => {
    return value.replace(/\D/g, "");
  };

  // Calculates completion rate based on key profile details
  const completionPercentage = useMemo(() => {
    const keysToTrack: (keyof ProfileState)[] = [
      "profilePhotoUrl",
      "phoneNumber",
      "address",
      "dateOfBirth",
      "gender",
      "maritalStatus",
      "emergencyContactName",
      "emergencyContactPhone",
    ];

    const filled = keysToTrack.filter((key) => !!profile[key]?.trim());
    return Math.round((filled.length / keysToTrack.length) * 100);
  }, [profile]);

  const canSave = useMemo(() => {
    return !saving && !uploadingPhoto;
  }, [saving, uploadingPhoto]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/employee/profile", { cache: "no-store" });
        if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
        const data = await res.json();

        const initialData = {
          fullName: data.fullName || "",
          email: data.email || "",
          profilePhotoUrl: data.profilePhotoUrl || "",
          phoneNumber: data.phoneNumber || "",
          address: data.address || "",
          dateOfBirth: data.dateOfBirth || "",
          gender: data.gender || "",
          maritalStatus: data.maritalStatus || "",
          emergencyContactName: data.emergencyContactName || "",
          emergencyContactPhone: data.emergencyContactPhone || "",
        };

        setProfile(initialData);
        setTempProfile(initialData);
      } catch (e: any) {
        console.error(e);
        Swal.fire({
          icon: "error",
          title: "Profile Data Retrieval Failed",
          text: e?.message || "Verify your connection or attempt again later.",
          confirmButtonColor: "#7c3aed",
          customClass: swalCustomClass
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleStartEditing = () => {
    setTempProfile({ ...profile });
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setTempProfile({ ...profile });
    setIsEditing(false);
    setIsGenderOpen(false);
    setIsMaritalOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    try {
      setSaving(true);

      const payload = {
        profilePhotoUrl: tempProfile.profilePhotoUrl,
        phoneNumber: tempProfile.phoneNumber,
        address: tempProfile.address,
        dateOfBirth: tempProfile.dateOfBirth,
        gender: tempProfile.gender,
        maritalStatus: tempProfile.maritalStatus,
        emergencyContactName: tempProfile.emergencyContactName,
        emergencyContactPhone: tempProfile.emergencyContactPhone,
      };

      const res = await fetch("/api/employee/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Save failed (${res.status})`);
      }

      setProfile(tempProfile);
      setIsEditing(false);
      Toast.fire({
        icon: "success",
        title: "Profile details updated",
        customClass: {
          popup: "bg-white border border-[var(--color-line-subtle)] rounded-2xl shadow-xl p-4 font-sans text-xs",
          title: "text-xs font-bold text-[var(--color-content-main)]",
        }
      });
    } catch (e: any) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: e?.message || "Please check your inputs and try again.",
        confirmButtonColor: "#7c3aed",
        customClass: swalCustomClass
      });
    } finally {
      setSaving(false);
    }
  };

  const onPhotoSelected = async (file: File | null) => {
    if (!file) return;
    try {
      setUploadingPhoto(true);
      Toast.fire({ icon: "info", title: "Uploading photo..." });

      const url = await uploadToCloudinary(file);

      const saveRes = await fetch("/api/employee/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilePhotoUrl: url }),
      });

      if (!saveRes.ok) {
        const data = await saveRes.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to save photo URL");
      }

      setTempProfile((p) => ({ ...p, profilePhotoUrl: url }));
      setProfile((p) => ({ ...p, profilePhotoUrl: url }));

      Toast.fire({
        icon: "success",
        title: "Photo saved successfully",
        customClass: {
          popup: "bg-white border border-[var(--color-line-subtle)] rounded-2xl shadow-xl p-4 font-sans text-xs",
          title: "text-xs font-bold text-[var(--color-content-main)]",
        }
      });
    } catch (e: any) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: e?.message || "Photo update failed. Please try again.",
        confirmButtonColor: "#7c3aed",
        customClass: swalCustomClass
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAvatarAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (uploadingPhoto) return;

    if (tempProfile.profilePhotoUrl) {
      try {
        setUploadingPhoto(true);

        const saveRes = await fetch("/api/employee/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profilePhotoUrl: "" }),
        });

        if (!saveRes.ok) {
          const data = await saveRes.json().catch(() => ({}));
          throw new Error(data?.error || "Failed to remove photo");
        }

        setTempProfile((p) => ({ ...p, profilePhotoUrl: "" }));
        setProfile((p) => ({ ...p, profilePhotoUrl: "" }));
        Toast.fire({
          icon: "success",
          title: "Photo removed",
          customClass: {
            popup: "bg-white border border-[var(--color-line-subtle)] rounded-2xl shadow-xl p-4 font-sans text-xs",
            title: "text-xs font-bold text-[var(--color-content-main)]",
          }
        });
      } catch (e: any) {
        console.error(e);
        Swal.fire({
          icon: "error",
          title: "Failed to remove photo",
          text: e?.message || "Please try again.",
          confirmButtonColor: "#7c3aed",
          customClass: swalCustomClass
        });
      } finally {
        setUploadingPhoto(false);
      }
    } else {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Toast.fire({ icon: "warning", title: "Fill in all fields." });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "New passwords do not match.",
        confirmButtonColor: "#7c3aed",
        customClass: swalCustomClass
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      Swal.fire({
        icon: "error",
        title: "Invalid Structure",
        text: "Password must be at least 8 characters in length.",
        confirmButtonColor: "#7c3aed",
        customClass: swalCustomClass
      });
      return;
    }

    try {
      setPasswordSaving(true);
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || "Failed to update password.");
      }

      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      Toast.fire({
        icon: "success",
        title: "Password changed successfully",
        customClass: {
          popup: "bg-white border border-[var(--color-line-subtle)] rounded-2xl shadow-xl p-4 font-sans text-xs",
          title: "text-xs font-bold text-[var(--color-content-main)]",
        }
      });
    } catch (e: any) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "Password Change Failed",
        text: e?.message || "Verify your current credentials and try again.",
        confirmButtonColor: "#7c3aed",
        customClass: swalCustomClass
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-8 h-8 text-[var(--color-brand-accent)] animate-spin" />
        <span className="text-sm font-semibold text-[var(--color-content-secondary)]">Retrieving your profile files...</span>
      </div>
    );
  }

  const initials = profile.fullName
    ? profile.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "EE";

  return (
    <div className={`space-y-6 max-w-[1100px] mx-auto pb-12 px-4 transition-all ${uploadingPhoto ? "cursor-wait select-none" : ""}`}>
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--color-line-subtle)] gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-[var(--color-content-main)]">
            Profile Settings
          </h1>
          <p className="mt-0.5 text-xs text-[var(--color-content-secondary)]">
            Keep your background details up to date.
          </p>
        </div>
        
        {/* Toggle Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {!isEditing ? (
            <button
              type="button"
              onClick={handleStartEditing}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-hover)] text-white text-xs font-bold rounded-lg shadow-sm transition active:scale-[0.98] cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelEditing}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-brand-subtle)] hover:bg-[var(--color-line-subtle)] text-[var(--color-brand-accent)] text-xs font-bold rounded-lg transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-hover)] disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Left Hand Card (Visual Overview & Progress Tracker) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="panel panel-section flex flex-col items-center text-center">
            
            {/* Avatar Container with Conditional Deletion / Upload logic */}
            <div 
              className="relative group rounded-full cursor-pointer"
              onClick={handleAvatarAction}
            >
              <div className="h-28 w-28 rounded-full border-2 border-[var(--color-line-subtle)] bg-[var(--color-surface-main)] flex items-center justify-center overflow-hidden shadow-inner relative transition duration-150 group-hover:ring-2 group-hover:ring-[var(--color-brand-accent)]/20">
                {tempProfile.profilePhotoUrl ? (
                  <img 
                    src={tempProfile.profilePhotoUrl} 
                    alt="Profile" 
                    className="h-full w-full object-cover" 
                  />
                ) : (
                  <span className="text-[var(--color-brand-accent)] font-extrabold text-xl tracking-wider">
                    {initials}
                  </span>
                )}

                {/* Overlays */}
                {tempProfile.profilePhotoUrl ? (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-full">
                    <Trash2 className="w-5 h-5 mb-0.5 text-red-400" />
                    <span className="text-[9px] font-bold tracking-wide uppercase text-red-300">Remove Photo</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 rounded-full">
                    <Camera className="w-5 h-5 mb-0.5" />
                    <span className="text-[9px] font-bold tracking-wide uppercase">Upload Photo</span>
                  </div>
                )}

                {/* Loading State Spinner */}
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-[var(--color-content-main)]/80 flex items-center justify-center text-white">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--color-brand-accent)]" />
                  </div>
                )}
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={(e) => onPhotoSelected(e.target.files?.[0] || null)}
              className="hidden"
              disabled={uploadingPhoto || !!tempProfile.profilePhotoUrl}
            />

            <h2 className="mt-3 text-base font-bold text-[var(--color-content-main)] leading-tight">
              {profile.fullName || "User Account"}
            </h2>
            <span className="text-xs text-[var(--color-content-secondary)] font-medium mt-0.5">
              {profile.email}
            </span>

            {/* Profile Progress Completion Bar */}
            <div className="w-full mt-4 pt-4 border-t border-[var(--color-line-subtle)] text-left">
              <div className="flex items-center justify-between text-[11px] font-bold text-[var(--color-content-secondary)] mb-1.5">
                <span>Profile Completion</span>
                <span className="text-[var(--color-brand-accent)]">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-[var(--color-line-subtle)]/50 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-[var(--color-brand-accent)] h-1.5 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Warn Panel */}
            <div className="mt-4 alert-warn">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-[10px] text-amber-800 leading-relaxed font-medium">
                Full Name and Email are structurally locked. Access HR options to request alterations.
              </div>
            </div>
          </div>
        </div>

        {/* Right Hand Forms */}
        <div className="lg:col-span-8 space-y-4">
          <form onSubmit={handleSave} className="space-y-4">
            
            {/* Section 1: Basic Information */}
            <div className="panel panel-section space-y-3">
              <div className="panel-header">
                <User className="w-4 h-4 text-[var(--color-brand-accent)]" />
                <h3 className="panel-header-title">General Identity</h3>
              </div>

              {!isEditing ? (
                // VIEW MODE
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-1">
                  <div>
                    <span className="field-label block">Date of Birth</span>
                    <span className="text-xs font-semibold text-[var(--color-content-main)] mt-0.5 block">
                      {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString("en-US", { dateStyle: "medium" }) : "Not provided"}
                    </span>
                  </div>
                  <div>
                    <span className="field-label block">Gender</span>
                    <span className="text-xs font-semibold text-[var(--color-content-main)] mt-0.5 block">{profile.gender || "Not provided"}</span>
                  </div>
                  <div>
                    <span className="field-label block">Marital Status</span>
                    <span className="text-xs font-semibold text-[var(--color-content-main)] mt-0.5 block">{profile.maritalStatus || "Not provided"}</span>
                  </div>
                </div>
              ) : (
                // EDIT MODE WITH CUSTOM DROPDOWNS
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="field-label block">Date of Birth</label>
                    <input
                      type="date"
                      value={tempProfile.dateOfBirth}
                      onChange={(e) => setTempProfile((p) => ({ ...p, dateOfBirth: e.target.value }))}
                      className="form-input text-xs cursor-pointer"
                    />
                  </div>

                  {/* Custom Gender Dropdown */}
                  <div className="space-y-1 relative" ref={genderRef}>
                    <label className="field-label block">Gender</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsGenderOpen(!isGenderOpen);
                        setIsMaritalOpen(false);
                      }}
                      className="dropdown-trigger flex items-center justify-between text-left cursor-pointer z-40 relative"
                    >
                      <span>{tempProfile.gender || "Select Gender"}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-[var(--color-content-muted)] transition-transform duration-200 ${isGenderOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isGenderOpen && (
                      <div className="dropdown-panel absolute left-0 right-0 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-150 z-50">
                        {["Male", "Female", "Other"].map((gender) => (
                          <button
                            key={gender}
                            type="button"
                            onClick={() => {
                              setTempProfile((p) => ({ ...p, gender }));
                              setIsGenderOpen(false);
                            }}
                            className={`dropdown-option ${
                              tempProfile.gender === gender ? "dropdown-option-active" : ""
                            }`}
                          >
                            {gender}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Custom Marital Status Dropdown */}
                  <div className="space-y-1 relative" ref={maritalRef}>
                    <label className="field-label block">Marital Status</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMaritalOpen(!isMaritalOpen);
                        setIsGenderOpen(false);
                      }}
                      className="dropdown-trigger flex items-center justify-between text-left cursor-pointer z-40 relative"
                    >
                      <span>{tempProfile.maritalStatus || "Select Status"}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-[var(--color-content-muted)] transition-transform duration-200 ${isMaritalOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isMaritalOpen && (
                      <div className="dropdown-panel absolute left-0 right-0 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-150 z-50">
                        {["Single", "Married", "Divorced", "Widowed"].map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => {
                              setTempProfile((p) => ({ ...p, maritalStatus: status }));
                              setIsMaritalOpen(false);
                            }}
                            className={`dropdown-option ${
                              tempProfile.maritalStatus === status ? "dropdown-option-active" : ""
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Contact Information */}
            <div className="panel panel-section space-y-3">
              <div className="panel-header">
                <MapPin className="w-4 h-4 text-[var(--color-brand-accent)]" />
                <h3 className="panel-header-title">Contact Coordinates</h3>
              </div>

              {!isEditing ? (
                // VIEW MODE
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-1">
                  <div className="md:col-span-1">
                    <span className="field-label block">Phone Number</span>
                    <span className="text-xs font-semibold text-[var(--color-content-main)] mt-0.5 block">{profile.phoneNumber || "Not provided"}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="field-label block">Physical Address</span>
                    <span className="text-xs font-semibold text-[var(--color-content-main)] mt-0.5 block leading-relaxed">{profile.address || "Not provided"}</span>
                  </div>
                </div>
              ) : (
                // EDIT MODE
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1 md:col-span-1">
                    <label className="field-label block">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="Numbers only"
                      value={tempProfile.phoneNumber}
                      onChange={(e) => setTempProfile((p) => ({ ...p, phoneNumber: sanitizeNumbersOnly(e.target.value) }))}
                      className="form-input text-xs"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="field-label block">Physical Address</label>
                    <input
                      type="text"
                      placeholder="Resident coordinates..."
                      value={tempProfile.address}
                      onChange={(e) => setTempProfile((p) => ({ ...p, address: e.target.value }))}
                      className="form-input text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Emergency Contacts */}
            <div className="panel panel-section space-y-3">
              <div className="panel-header">
                <HeartHandshake className="w-4 h-4 text-[var(--color-brand-accent)]" />
                <h3 className="panel-header-title">Emergency Contact</h3>
              </div>

              {!isEditing ? (
                // VIEW MODE
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-1">
                  <div>
                    <span className="field-label block">Contact Person</span>
                    <span className="text-xs font-semibold text-[var(--color-content-main)] mt-0.5 block">{profile.emergencyContactName || "Not provided"}</span>
                  </div>
                  <div>
                    <span className="field-label block">Contact Number</span>
                    <span className="text-xs font-semibold text-[var(--color-content-main)] mt-0.5 block">{profile.emergencyContactPhone || "Not provided"}</span>
                  </div>
                </div>
              ) : (
                // EDIT MODE
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="field-label block">Contact Person Name</label>
                    <input
                      type="text"
                      placeholder="Kin name..."
                      value={tempProfile.emergencyContactName}
                      onChange={(e) => setTempProfile((p) => ({ ...p, emergencyContactName: e.target.value }))}
                      className="form-input text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="field-label block">Contact Phone Number</label>
                    <input
                      type="tel"
                      placeholder="Numbers only"
                      value={tempProfile.emergencyContactPhone}
                      onChange={(e) => setTempProfile((p) => ({ ...p, emergencyContactPhone: sanitizeNumbersOnly(e.target.value) }))}
                      className="form-input text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* Section 4: Security (Password Modification Panel) */}
          <div className="panel">
            <div className="panel-section space-y-4">
              <div className="panel-header">
                <ShieldAlert className="w-4 h-4 text-[var(--color-brand-accent)]" />
                <h3 className="panel-header-title">Security & Credentials</h3>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="field-label block">Current Password</label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))}
                      className="form-input text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="field-label block">New Password</label>
                    <input
                      type="password"
                      placeholder="Min. 8 characters"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData((p) => ({ ...p, newPassword: e.target.value }))}
                      className="form-input text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="field-label block">Confirm Password</label>
                    <input
                      type="password"
                      placeholder="Re-enter password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))}
                      className="form-input text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-[var(--color-line-subtle)]">
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="inline-flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-bold text-white bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-hover)] rounded-xl shadow-xs transition duration-150 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {passwordSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5" />
                    )}
                    <span>{passwordSaving ? "Updating..." : "Update Password"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}