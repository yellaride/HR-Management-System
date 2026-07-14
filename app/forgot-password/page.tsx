"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Example endpoint call to handle password resets
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errMsg = String(data.message || "");
        const looksLikeServerDown =
          /ECONNREFUSED|ECONNRESET|MongoNetworkError|MongoError|timed out|failed to connect|Service unavailable/i.test(errMsg);

        if (looksLikeServerDown) {
          setError("The authentication server is currently unreachable. Please try again shortly.");
        } else {
          setError(errMsg || "This email address is not recognized in our workspace database.");
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError("An unexpected error occurred. Please verify your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-base,#fafafa)] text-[var(--color-content-main)]">
      
      {/* Animation Styles injected to match the main login behavior */}
      <style>{`
        @keyframes formSlideFade {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-form-flow {
          animation: formSlideFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Header Navigation */}
      <header className="w-full py-3 px-6 md:px-12 border-b border-slate-100 dark:border-slate-800/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-brand-accent)] text-white flex items-center justify-center font-black text-lg shadow-sm transition-transform group-hover:scale-105 duration-200">
              V
            </div>
            <span className="font-bold text-lg tracking-tight text-[var(--color-content-main)]">
              VibeFlow<span className="text-[var(--color-brand-accent)]">.</span>
            </span>
          </Link>
          <div />
        </div>
      </header>

      {/* Main Content Split Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 py-6 lg:py-10 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-stretch">
          
          {/* Left Side: Visual Hero Panel (Consistent with Home) */}
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
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
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
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-accent)]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-accent)]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-accent)]" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Gateway Action Panel */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-900/40 p-8 md:p-10 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-lg shadow-slate-100/50 dark:shadow-none">
              
              <form onSubmit={handleSubmit} className="space-y-6 animate-form-flow">
                
                {/* Unified Modern Title & Subtitle */}
                <div className="min-h-[82px] flex flex-col justify-start">
                  <h2 className="text-xl md:text-2xl font-bold text-[var(--color-content-main)] tracking-tight leading-none">
                    Reset Password
                  </h2>
                  <p className="mt-2 text-xs md:text-sm text-[var(--color-content-secondary)] leading-relaxed font-normal opacity-90">
                    Provide your workspace email to obtain a secure password recovery connection link.
                  </p>
                </div>

                {/* Error Notifications */}
                {error && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold leading-relaxed">
                    <svg className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* Success Notifications */}
                {success && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold leading-relaxed">
                    <svg className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>We have sent a secure recovery link to your registered workspace address. Please review your inbox.</span>
                  </div>
                )}

                {/* Input Field using Semantic Global Classes */}
                {!success && (
                  <div className="space-y-4">
                    <div>
                      <label className="field-label block mb-1.5">
                        Registered Email
                      </label>
                      <input
                        type="email"
                        required
                        disabled={loading}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@vibeflow.com"
                        className="form-input auth-input-focus"
                      />
                    </div>
                  </div>
                )}

                {/* Unified Action Buttons */}
                <div className="space-y-4 pt-2">
                  {!success && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-brand-filled cursor-pointer w-full"
                    >
                      {loading ? (
                        <span>Sending Link...</span>
                      ) : (
                        <>
                          <svg className="w-4.5 h-4.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>Email Recovery Link</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Redirection Link back to Workspace Login */}
                  <div className="text-center pt-2">
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--color-brand-accent)] hover:underline transition duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to Sign In
                    </Link>
                  </div>
                </div>

              </form>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}