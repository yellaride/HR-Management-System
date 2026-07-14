"use client";

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Loader2, Edit2, CheckCircle2, X, Building, MapPin, Phone } from "lucide-react";

import ChangePasswordSettings from "@/app/components/change-password";

interface CompanySettingsState {
  companyName: string;
  location: string;
  phone: string;
  email: string;
  standardWorkingHours: number;
}

const swalCustomClass = {
  popup: "bg-white rounded-2xl border border-[var(--color-line-subtle)] shadow-xl font-sans",
  title: "text-sm font-bold text-[var(--color-content-main)]",
  htmlContainer: "text-xs text-[var(--color-content-secondary)]",
  confirmButton:
    "px-4.5 py-2.5 text-xs font-bold rounded-xl text-white bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-hover)] border-none outline-none cursor-pointer transition",
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

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [companyData, setCompanyData] = useState<CompanySettingsState>({
    companyName: "",
    location: "",
    phone: "",
    email: "",
    standardWorkingHours: 160,
  });

  const [tempCompanyData, setTempCompanyData] = useState<CompanySettingsState>({
    ...companyData,
  });

  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/settings/company-settings");
        if (!res.ok) throw new Error("Could not load corporate profiles.");
        const data = await res.json();

        const payload: CompanySettingsState = {
          companyName: data.companyName || "",
          location: data.location || "",
          phone: data.phone || "",
          email: data.email || "",
          standardWorkingHours:
            typeof data.standardWorkingHours === "number" ? data.standardWorkingHours : 160,
        };

        setCompanyData(payload);
        setTempCompanyData(payload);
      } catch (error: any) {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "Retrieval Failed",
          text: error?.message || "Could not retrieve system configuration. Try again.",
          confirmButtonColor: "#7c3aed",
          customClass: swalCustomClass,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCompanySettings();
  }, []);

  const handleStartEditing = () => {
    setTempCompanyData({ ...companyData });
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setTempCompanyData({ ...companyData });
    setIsEditing(false);
  };

  const handleSaveCompanyDetails = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tempCompanyData.companyName.trim()) {
      Toast.fire({ icon: "warning", title: "Company Name is required" });
      return;
    }

    if (!Number.isFinite(tempCompanyData.standardWorkingHours) || tempCompanyData.standardWorkingHours < 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Hours",
        text: "Standard working hours must be 0 or a positive number.",
        confirmButtonColor: "#7c3aed",
        customClass: swalCustomClass,
      });
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/settings/company-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tempCompanyData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || "Failed to update corporate profile.");
      }

      setCompanyData(tempCompanyData);
      setIsEditing(false);
      Toast.fire({
        icon: "success",
        title: "Company details updated",
        customClass: {
          popup:
            "bg-white border border-[var(--color-line-subtle)] rounded-2xl shadow-xl p-4 font-sans text-xs",
          title: "text-xs font-bold text-[var(--color-content-main)]",
        },
      });
    } catch (error: any) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: error?.message || "Verify your connection parameters and try again.",
        confirmButtonColor: "#7c3aed",
        customClass: swalCustomClass,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 bg-[var(--color-surface-main)]">
        <Loader2 className="w-8 h-8 text-[var(--color-brand-accent)] animate-spin" />
        <span className="text-sm font-semibold text-[var(--color-content-secondary)]">
          Retrieving dashboard parameters...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-main)] text-[var(--color-content-main)] antialiased py-6 lg:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-6">
        <div className="flex items-center justify-between pb-6 border-b border-[var(--color-line-subtle)]">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[var(--color-content-main)]">System Settings</h1>
            <p className="mt-1 text-xs text-[var(--color-content-secondary)]">
              Modify corporate credentials and security frameworks to control admin dashboard metrics.
            </p>
          </div>
        </div>

        <div className="panel">
          <div className="panel-section space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--color-line-subtle)]">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-[var(--color-brand-accent)]" />
                <h3 className="panel-header-title">Corporate Information</h3>
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
                    onClick={handleSaveCompanyDetails}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-hover)] disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{saving ? "Saving..." : "Save Changes"}</span>
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveCompanyDetails} className="space-y-4">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="field-label block">Company Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Enterprise Solutions Ltd"
                      value={tempCompanyData.companyName}
                      onChange={(e) => setTempCompanyData({ ...tempCompanyData, companyName: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="field-label block">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Lahore, Pakistan"
                      value={tempCompanyData.location}
                      onChange={(e) => setTempCompanyData({ ...tempCompanyData, location: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="field-label block">Contact Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. +92 42 111 222 333"
                      value={tempCompanyData.phone}
                      onChange={(e) => setTempCompanyData({ ...tempCompanyData, phone: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="field-label block">Company Email</label>
                    <input
                      type="email"
                      placeholder="e.g. hr@company.com"
                      value={tempCompanyData.email}
                      onChange={(e) => setTempCompanyData({ ...tempCompanyData, email: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="field-label block">Standard Working Hours</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      required
                      value={tempCompanyData.standardWorkingHours}
                      onChange={(e) =>
                        setTempCompanyData({
                          ...tempCompanyData,
                          // Keep numeric value but prevent leading-zero issues by converting only when non-empty.
                          standardWorkingHours: e.target.value === "" ? 0 : Number.parseInt(e.target.value, 10),
                        })
                      }
                      className="form-input text-xs"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-1">
                  <div className="space-y-1">
                    <span className="field-label block">Company Name</span>
                    <span className="text-sm font-semibold text-[var(--color-content-main)] flex items-center gap-2 mt-0.5">
                      {companyData.companyName || "Not Provided"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="field-label block">Location / Head Office</span>
                    <span className="text-sm font-semibold text-[var(--color-content-main)] flex items-center gap-2 mt-0.5">
                      {companyData.location || "Not Provided"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="field-label block">Phone Line</span>
                    <span className="text-sm font-semibold text-[var(--color-content-main)] flex items-center gap-2 mt-0.5">
                      {companyData.phone || "Not Provided"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="field-label block">Company Email</span>
                    <span className="text-sm font-semibold text-[var(--color-content-main)] flex items-center gap-2 mt-0.5">
                      {companyData.email || "Not Provided"}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="field-label block">Standard Working Hours</span>
                    <span className="text-sm font-semibold text-[var(--color-content-main)] flex items-center gap-2 mt-0.5">
                      {companyData.standardWorkingHours} <span className="text-xs text-[var(--color-content-secondary)]">hours / month</span>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="field-label block"> </span>
                    <span className="text-sm font-semibold text-[var(--color-content-main)]" />
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        <div className="flex justify-start">
          <ChangePasswordSettings role="admin" />
        </div>
      </div>
    </div>
  );
}

