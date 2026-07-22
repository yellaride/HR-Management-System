"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import PasswordInputWithToggle from "@/app/components/PasswordInputWithToggle";


function ResetPasswordFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // The missing-parameters case is derived at render time instead of being set in the effect
  const missingParams = !token || !email;

  // 1. Verify the token on component mount
  useEffect(() => {
    if (!token || !email) {
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(
          `/api/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`
        );
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setError(data.message || "This password reset link is invalid or has expired.");
          setTokenValid(false);
        } else {
          setTokenValid(true);
        }
      } catch {
        setError("Unable to connect to the verification server. Please try again.");
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token, email]);

  // Effective flags used by the UI, accounting for missing reset parameters
  const isVerifying = !missingParams && verifying;
  const isTokenValid = !missingParams && tokenValid;
  const displayError = missingParams
    ? "The reset parameters are missing. Please request a new link."
    : error;

  // 2. Handle updating the password
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          token,
          newPassword: password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.message || "Failed to update password.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      // Automatically redirect to Sign In page after 4 seconds
      setTimeout(() => {
        router.push("/");
      }, 4000);
    } catch {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-900/40 p-8 md:p-10 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-lg shadow-slate-100/50 dark:shadow-none">
      
      {/* 1. Verifying State */}
      {isVerifying && (
        <div className="text-center py-8 space-y-4">
          <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs md:text-sm text-content-secondary">
            Verifying secure link authorization...
          </p>
        </div>
      )}

      {/* 2. Error Display (If token validation failed) */}
      {!isVerifying && !isTokenValid && (
        <div className="space-y-6">
          <div className="min-h-[82px] flex flex-col justify-start">
            <h2 className="text-xl md:text-2xl font-bold text-content-main tracking-tight leading-none">
              Invalid Link
            </h2>
            <p className="mt-2 text-xs md:text-sm text-content-secondary leading-relaxed font-normal opacity-90">
              The link you used might be expired, used, or modified.
            </p>
          </div>

          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold leading-relaxed">
            <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{displayError || "Verification failed."}</span>
          </div>

          <Link href="/forgot-password" className="btn-brand-filled cursor-pointer w-full inline-flex justify-center items-center gap-2">
            Request New Reset Link
          </Link>
        </div>
      )}

      {/* 3. Main Form Area (If token is valid) */}
      {!isVerifying && isTokenValid && (
        <form onSubmit={handleSubmit} className="space-y-6 animate-form-flow">
          
          <div className="min-h-[82px] flex flex-col justify-start">
            <h2 className="text-xl md:text-2xl font-bold text-content-main tracking-tight leading-none">
              Setup New Password
            </h2>
            <p className="mt-2 text-xs md:text-sm text-content-secondary leading-relaxed font-normal opacity-90">
              Complete your security criteria configurations below to authenticate.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold leading-relaxed">
              <svg className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold leading-relaxed">
              <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Password updated successfully! Redirecting you to sign in...</span>
            </div>
          )}

          {!success && (
            <div className="space-y-4">
              <PasswordInputWithToggle
                label="New Password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
                disabled={loading}
                inputClassName="form-input auth-input-focus"
              />

              <PasswordInputWithToggle
                label="Confirm Password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="••••••••"
                disabled={loading}
                inputClassName="form-input auth-input-focus"
              />
            </div>
          )}

          <div className="space-y-4 pt-2">
            {!success && (
              <button
                type="submit"
                disabled={loading}
                className="btn-brand-filled cursor-pointer w-full"
              >
                {loading ? (
                  <span>Updating Password...</span>
                ) : (
                  <>
                    <svg className="w-4.5 h-4.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Save New Password</span>
                  </>
                )}
              </button>
            )}

            <div className="text-center pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-semibold text-brand-accent hover:underline transition duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Sign In
              </Link>
            </div>
          </div>

        </form>
      )}
    </div>
  );
}

// Wrap Content inside React Suspense context block since search params hook is used on CSR
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-base text-content-main">
      {/* Header Navigation */}

      <header className="w-full py-3 px-6 md:px-12 border-b border-slate-100 dark:border-slate-800/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-brand-accent text-white flex items-center justify-center font-black text-lg shadow-sm transition-transform group-hover:scale-105 duration-200">
              V
            </div>
            <span className="font-bold text-lg tracking-tight text-content-main">
              VibeFlow<span className="text-brand-accent">.</span>
            </span>
          </Link>
          <div />
        </div>
      </header>

      {/* Main Content Split Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 py-6 lg:py-10 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-stretch">
          
          {/* Left Side: Visual Hero Panel */}
          <div className="lg:col-span-7 relative rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between p-8 md:p-12 min-h-[400px] lg:h-full group">
            
            {/* Visual Background Layer */}
            <div className="absolute inset-0 z-0 transition-transform duration-700 ease-out group-hover:scale-105">
              <Image 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80" 
                alt="Collaborative workspace background" 
                fill
                priority
                className="object-cover filter brightness-[0.7] contrast-[0.95]"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-900/40 to-transparent" />
            </div>

            {/* Upper Badge */}
            <div className="relative z-10 self-start">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-white bg-white/10 backdrop-blur-md border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Enterprise Hub
              </span>
            </div>

            {/* Descriptive Content */}
            <div className="relative z-10 mt-auto">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight max-w-xl">
                Securing access to your workspace.
              </h1>
              <p className="mt-4 text-sm md:text-base text-slate-300 max-w-md font-normal leading-relaxed">
                Access secure platforms, connect with departments, and optimize your modern workflow in one unified location.
              </p>
              
              <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-6 max-w-sm">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                  Security Level Verified
                </span>
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Gateway Action Panel */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <Suspense fallback={
              <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-900/40 p-8 md:p-10 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-lg text-center">
                Loading parameters...
              </div>
            }>
              <ResetPasswordFormContent />
            </Suspense>
          </div>

        </div>
      </main>
    </div>
  );
}