"use client";

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Loader2 } from "lucide-react";

import ChangePasswordSettings from "@/app/components/change-password";
import CompanyInfoSettings from "@/app/components/admin/settings/CompanyInfoSettings";
import DepartmentSettings from "@/app/components/admin/settings/DepartmentSettings";
import AttendanceSettings from "@/app/components/admin/settings/AttendanceSettings";


interface CompanySettingsState {
  companyName: string;
  location: string;
  phone: string;
  email: string;
  standardWorkingHours: number;
  departments: string[];
  shiftStart: string;
  shiftEnd: string;
  gracePeriod: number;
  checkInDisplayBefore: number;
  checkOutDisplayAfter: number;
  autoCheckOut: boolean;
  autoCheckOutTime: string;
}

const swalCustomClass = {
  popup: "bg-white rounded-2xl border border-line-subtle shadow-xl font-sans",
  title: "text-sm font-bold text-content-main",
  htmlContainer: "text-xs text-content-secondary",
  confirmButton:
    "px-4.5 py-2.5 text-xs font-bold rounded-xl text-white bg-brand-accent hover:bg-brand-hover border-none outline-none cursor-pointer transition",
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
  const [settings, setSettings] = useState<CompanySettingsState>({
    companyName: "",
    location: "",
    phone: "",
    email: "",
    standardWorkingHours: 160,
    departments: [],
    shiftStart: "09:00",
    shiftEnd: "17:00",
    gracePeriod: 15,
    checkInDisplayBefore: 30,
    checkOutDisplayAfter: 0,
    autoCheckOut: false,
    autoCheckOutTime: "18:00",
  });

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings/company-settings");
      if (!res.ok) throw new Error("Could not load configurations.");
      const data = await res.json();

      setSettings({
        companyName: data.companyName || "",
        location: data.location || "",
        phone: data.phone || "",
        email: data.email || "",
        standardWorkingHours: typeof data.standardWorkingHours === "number" ? data.standardWorkingHours : 160,
        departments: Array.isArray(data.departments) ? data.departments : [],
        shiftStart: data.shiftStart || "09:00",
        shiftEnd: data.shiftEnd || "17:00",
        gracePeriod: typeof data.gracePeriod === "number" ? data.gracePeriod : 15,
        checkInDisplayBefore: typeof data.checkInDisplayBefore === "number" ? data.checkInDisplayBefore : 30,
        checkOutDisplayAfter: typeof data.checkOutDisplayAfter === "number" ? data.checkOutDisplayAfter : 0,
        autoCheckOut: typeof data.autoCheckOut === "boolean" ? data.autoCheckOut : false,
        autoCheckOutTime: data.autoCheckOutTime || "18:00",
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Retrieval Failed",
        text: error instanceof Error ? error.message : "Could not retrieve system configurations.",
        confirmButtonColor: "#7c3aed",
        customClass: swalCustomClass,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadSettings() {
      fetchSettings();
    }
    loadSettings();
  }, []);

  const handleUpdateSettings = async (updatedFields: Partial<CompanySettingsState>) => {
    const payload = { ...settings, ...updatedFields };
    try {
      const res = await fetch("/api/settings/company-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || "Failed to update details.");
      }

      setSettings(payload);
      Toast.fire({
        icon: "success",
        title: "Configuration updated",
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: error instanceof Error ? error.message : "Verify your connection parameters and try again.",
        confirmButtonColor: "#7c3aed",
        customClass: swalCustomClass,
      });
      throw error;
    }
  };

  const handleAddDepartment = async (name: string) => {
    await handleUpdateSettings({
      departments: [...settings.departments, name],
    });
  };

  const handleDeleteDepartment = async (name: string) => {
    const result = await Swal.fire({
      title: "Delete Department?",
      text: `Are you sure you want to delete "${name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#ef4444",
      customClass: swalCustomClass,
    });

    if (result.isConfirmed) {
      await handleUpdateSettings({
        departments: settings.departments.filter((d) => d !== name),
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3 bg-surface-main">
        <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
        <span className="text-sm font-semibold text-content-secondary">
          Retrieving configuration parameters...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-main text-content-main antialiased ">
      <div className=" w-full space-y-6 ">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-content-main">System Settings</h1>
          <p className="mt-1 text-xs text-content-secondary">
            Configure company attributes, structural departments, work timing constraints, and account security.
          </p>
        </div>

        <CompanyInfoSettings 
          data={settings} 
          onSave={handleUpdateSettings} 
        />
        <AttendanceSettings 
          data={settings} 
          onSave={handleUpdateSettings} 
        />

        <DepartmentSettings 
          departments={settings.departments} 
          onAdd={handleAddDepartment} 
          onDelete={handleDeleteDepartment} 
        />

        

        <div className="flex justify-start">
          <ChangePasswordSettings role="admin" />
        </div>
      </div>
    </div>
  );
}