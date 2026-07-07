"use client";

import React, { useState, useEffect } from "react";
import { Save, CheckCircle2, AlertCircle } from "lucide-react";

export default function AdminLeavesPolicyPage() {
  const [policy, setPolicy] = useState({
    ANNUAL: 15,
    SICK: 8,
    CASUAL: 6,
  });
  
  // Saves an immutable copy of the policy to support cancellations
  const [originalPolicy, setOriginalPolicy] = useState({
    ANNUAL: 15,
    SICK: 8,
    CASUAL: 6,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [banner, setBanner] = useState<{ status: "success" | "error"; message: string } | null>(
    null
  );

  useEffect(() => {
    async function fetchPolicy() {
      try {
        const res = await fetch("/api/admin/leaves-policy");
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          const loadedPolicy = {
            ANNUAL: data.ANNUAL ?? 15,
            SICK: data.SICK ?? 8,
            CASUAL: data.CASUAL ?? 6,
          };
          setPolicy(loadedPolicy);
          setOriginalPolicy(loadedPolicy);
        } else {
          setBanner({
            status: "error",
            message: data.error || "Failed to load global leave policies from the server.",
          });
        }
      } catch (err) {
        console.error("Failed to load policy limits.", err);
        setBanner({
          status: "error",
          message: "Network error occurred while fetching policy configurations.",
        });
      } finally {
        setInitialLoading(false);
      }
    }
    fetchPolicy();
  }, []);

  const handleNumberChange = (key: "ANNUAL" | "SICK" | "CASUAL", valString: string) => {
    // Strips leading zeros and treats completely blank fields as 0 safely
    const parsedValue = parseInt(valString, 10);
    setPolicy((prev) => ({
      ...prev,
      [key]: isNaN(parsedValue) ? 0 : parsedValue,
    }));
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setBanner(null);

    try {
      const res = await fetch("/api/admin/leaves-policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(policy),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setBanner({
          status: "success",
          message: "Global leave policies adjusted and applied for active users.",
        });
        
        const savedPolicy = {
          ANNUAL: typeof data?.ANNUAL === "number" ? data.ANNUAL : policy.ANNUAL,
          SICK: typeof data?.SICK === "number" ? data.SICK : policy.SICK,
          CASUAL: typeof data?.CASUAL === "number" ? data.CASUAL : policy.CASUAL,
        };
        
        setPolicy(savedPolicy);
        setOriginalPolicy(savedPolicy);
        setIsEditing(false);
      } else {
        setBanner({
          status: "error",
          message: data.error || "Failed to update configurations in standard policies schema.",
        });
      }
    } catch (err) {
      console.error("Error updating policy limits.", err);
      setBanner({ 
        status: "error", 
        message: "Network error processing updates. Please try again." 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setPolicy(originalPolicy);
    setIsEditing(false);
    setBanner(null);
  };

  return (
    <div className="max-w-3xl  space-y-6 min-h-screen">
      
      {/* Header Section without setting icon */}
      <div className="pb-6 border-b border-[var(--color-line-subtle)]">
        <h1 className="text-2xl font-extrabold text-content-main tracking-tight font-sans">Leaves Policy</h1>
        <p className="text-xs text-[var(--color-content-muted)] mt-0.5">
          Configure global annual thresholds for employee leave types.
        </p>
      </div>

      {banner && (
        <div
          className={`flex items-center gap-2.5 p-4 rounded-xl text-xs font-semibold border ${
            banner.status === "success"
              ? "bg-emerald-50 border-emerald-100 text-emerald-800"
              : "bg-rose-50 border-rose-100 text-rose-800"
          }`}
        >
          {banner.status === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{banner.message}</span>
        </div>
      )}

      {initialLoading ? (
        <div className="text-center py-12 text-xs text-[var(--color-content-muted)] font-semibold">
          Loading current policy configurations...
        </div>
      ) : (
        <form 
          onSubmit={handleSavePolicy} 
          className="bg-[var(--color-surface-card)] border border-[var(--color-line-subtle)] rounded-2xl p-6 shadow-sm space-y-6"
        >
          <h2 className="text-sm font-bold text-[var(--color-content-main)]">Allotted Standard Days</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Annual Allotment */}
            <div className="space-y-1.5">
              <label className="field-label block mb-1.5">
                Annual Leaves
              </label>
              <input
                type="number"
                min={0}
                required
                disabled={!isEditing || loading}
                value={policy.ANNUAL === 0 ? "" : policy.ANNUAL.toString()}
                onChange={(e) => handleNumberChange("ANNUAL", e.target.value)}
                className="form-input font-mono"
              />
            </div>

            {/* Sick Allotment */}
            <div className="space-y-1.5">
              <label className="field-label block mb-1.5">
                Sick Leaves
              </label>
              <input
                type="number"
                min={0}
                required
                disabled={!isEditing || loading}
                value={policy.SICK === 0 ? "" : policy.SICK.toString()}
                onChange={(e) => handleNumberChange("SICK", e.target.value)}
                className="form-input font-mono"
              />
            </div>

            {/* Casual Allotment */}
            <div className="space-y-1.5">
              <label className="field-label block mb-1.5">
                Casual Leaves
              </label>
              <input
                type="number"
                min={0}
                required
                disabled={!isEditing || loading}
                value={policy.CASUAL === 0 ? "" : policy.CASUAL.toString()}
                onChange={(e) => handleNumberChange("CASUAL", e.target.value)}
                className="form-input font-mono"
              />
            </div>
          </div>

          {/* Dynamic Edit/Save Controls Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-line-subtle)]">
            {/* Cancel Button (only rendered when editing) */}
            {isEditing && (
              <button
                key="cancel-btn"
                type="button"
                disabled={loading}
                onClick={handleCancel}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[var(--color-content-secondary)] bg-[var(--color-surface-main)] hover:bg-[var(--color-surface-card)] border border-[var(--color-line-subtle)] rounded-xl transition duration-150 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
            )}

            {/* Edit Button (only rendered when NOT editing) */}
            {!isEditing && (
              <button
                key="edit-btn"
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-hover)] rounded-xl transition duration-150 cursor-pointer"
              >
                <span>Edit Policy</span>
              </button>
            )}

            {/* Save Button (only rendered when editing) */}
            {isEditing && (
              <button
                key="save-btn"
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-hover)] disabled:opacity-50 rounded-xl transition duration-150 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? "Saving Changes..." : "Save Policy"}</span>
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}