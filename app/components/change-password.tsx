"use client";

import React, { useState } from "react";
import {
  Key,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  X,
} from "lucide-react";
import PasswordInputWithToggle from "./PasswordInputWithToggle";

interface ChangePasswordSettingsProps {
  role: "admin" | "employee";
}

export default function ChangePasswordSettings({
  role,
}: ChangePasswordSettingsProps) {
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);

  const roleLabel =
    role === "admin" ? "Administrator Portal" : "Employee Portal";

  // Password Requirements Logic
  const newPassword = passwordForm.newPassword;
  const checks = {
    length: newPassword.length >= 8,
    number: /\d/.test(newPassword),
    specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  const isFormValid =
    checks.length &&
    checks.number &&
    checks.specialChar &&
    passwordForm.currentPassword.length > 0 &&
    passwordForm.newPassword === passwordForm.confirmPassword;

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatusMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/settings/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update password.");
      }

      // Show inline success feedback
      setStatusMessage({
        type: "success",
        text: "Your security credentials have been successfully updated.",
      });

      // Clear/Reset all password input fields
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again.";
      setStatusMessage({ type: "error", text: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--color-surface-card)] border border-[var(--color-line-subtle)] rounded-2xl shadow-sm overflow-hidden max-w-xl w-full">
      {/* Header Container */}
      <div className="px-6 py-5 border-b border-[var(--color-line-subtle)] bg-slate-50/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-[var(--color-content-main)] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[var(--color-brand-accent)]" />
            <span>Update Security Password</span>
          </h2>
          <p className="text-xs text-[var(--color-content-secondary)]">
            Keep your account secure by modifying your login credentials periodically.
          </p>
        </div>

        <span className="inline-flex self-start text-[10px] font-extrabold px-3 py-1 rounded-2xl border tracking-wide uppercase bg-[var(--color-brand-subtle)]/70 border-[var(--color-brand-accent)]/20 text-[var(--color-brand-accent)]">
          {roleLabel}
        </span>
      </div>

      <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5">
        
        {/* Inline Status Message */}
        {statusMessage && (
          <div
            className={`flex items-start gap-2.5 p-4 rounded-xl text-xs font-semibold ${
              statusMessage.type === "success"
                ? "bg-emerald-50 border border-emerald-150 text-emerald-800"
                : "bg-rose-50 border border-rose-150 text-rose-800"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
            )}
            <span className="leading-relaxed">{statusMessage.text}</span>
          </div>
        )}

        {/* Input Fields Container */}
        <div className="space-y-4">
          
          {/* Current Password Field */}
          <PasswordInputWithToggle
            label="Current Password"
            value={passwordForm.currentPassword}
            onChange={(val) => setPasswordForm({ ...passwordForm, currentPassword: val })}
            placeholder="••••••••"
            disabled={loading}
            leftIcon={<Key className="w-4 h-4" />}
            inputClassName="form-input"
          />

          <hr className="border-[var(--color-line-subtle)] my-2" />

          {/* New Password Field */}
          <PasswordInputWithToggle
            label="New Password"
            value={passwordForm.newPassword}
            onChange={(val) => setPasswordForm({ ...passwordForm, newPassword: val })}
            placeholder="••••••••"
            disabled={loading}
            leftIcon={<Lock className="w-4 h-4" />}
            inputClassName="form-input"
          />

          {/* Live Requirements Helper Panel */}
          {passwordForm.newPassword && (
            <div className="p-3 bg-[var(--color-surface-main)] border border-[var(--color-line-subtle)] rounded-xl space-y-1.5">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--color-content-muted)]">
                Security Criteria
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px]">
                <div className="flex items-center gap-1.5">
                  {checks.length ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className={checks.length ? "text-[var(--color-content-secondary)]" : "text-[var(--color-content-muted)]"}>
                    Min 8 characters
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {checks.number ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className={checks.number ? "text-[var(--color-content-secondary)]" : "text-[var(--color-content-muted)]"}>
                    At least 1 number
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {checks.specialChar ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className={checks.specialChar ? "text-[var(--color-content-secondary)]" : "text-[var(--color-content-muted)]"}>
                    1 special char
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Password Field */}
          <PasswordInputWithToggle
            label="Confirm New Password"
            value={passwordForm.confirmPassword}
            onChange={(val) => setPasswordForm({ ...passwordForm, confirmPassword: val })}
            placeholder="••••••••"
            disabled={loading}
            leftIcon={<Lock className="w-4 h-4" />}
            inputClassName="form-input"
          />
        </div>

        {/* Submit Actions Button */}
        <div className="pt-4 border-t border-[var(--color-line-subtle)] flex justify-end">
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-accent)] focus:ring-offset-2 focus:ring-offset-[var(--color-surface-main)]"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Applying Changes...</span>
              </>
            ) : (
              <span>Update Password</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}