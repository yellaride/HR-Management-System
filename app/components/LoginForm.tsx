"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export interface LoginFormProps {
  role: "employee" | "admin";
}

export default function LoginForm({ role }: LoginFormProps) {
  const isAdmin = role === "admin";
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        role,
      });

      if (res?.error) {
        setError(res.error || "Authentication failed. Please verify your credentials.");
        setLoading(false);
        return;
      }

      if (isAdmin) {
        router.push("admin/dashboard");
      } else {
        router.push("/employee/dashbord");
      }
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred. Please try again later.");
      setLoading(false);
    }
  };

  return (
    <>
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

      <form onSubmit={handleSubmit} className="space-y-6 animate-form-flow">
        
        <div className="min-h-[82px] flex flex-col justify-start">
          <h2 className="text-xl md:text-2xl font-bold text-[var(--color-content-main)] tracking-tight leading-none">
            {isAdmin ? "Administrative Portal" : "Employee Portal"}
          </h2>
          <p className="mt-2 text-xs md:text-sm text-[var(--color-content-secondary)] leading-relaxed font-normal opacity-90">
            {isAdmin
              ? "For HR, IT, executive management, and directory coordination access."
              : "Access your paystubs, time off, communication feeds, and personal schedule."}
          </p>
        </div>

        {error && (
          <div className="p-3 text-xs md:text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl font-medium">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-[var(--color-content-secondary)] mb-1.5">
              {isAdmin ? "Admin Identifier / Email" : "Employee Email Address"}
            </label>
            <input
              type="email"
              required
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isAdmin ? "admin@vibeflow.com" : "name@vibeflow.com"}
className="form-input auth-input-focus"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-[var(--color-content-secondary)] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--color-content-muted)] hover:text-[var(--color-content-secondary)] transition-colors focus:outline-none"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-medium">
          <label className="flex items-center gap-2 text-[var(--color-content-secondary)] cursor-pointer select-none">
            <input
              type="checkbox"
              disabled={loading}
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-[var(--color-line-subtle)] text-[var(--color-brand-accent)] focus:ring-[var(--color-brand-accent)] w-4 h-4 transition"
            />
            <span>Remember device</span>
          </label>
          <Link href="#" className="text-[var(--color-brand-accent)] hover:underline font-semibold transition">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-sm disabled:opacity-50 ${
            isAdmin
              ? "bg-purple-900 hover:bg-purple-850 text-white"
              : "bg-[var(--color-brand-accent)] hover:bg-[var(--color-brand-hover)] text-white"
          }`}
        >
          {loading ? (
            <span>Signing in...</span>
          ) : isAdmin ? (
            <>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Authorize Admin Access
            </>
          ) : (
            <>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Access Employee Portal
            </>
          )}
        </button>
      </form>
    </>
  );
}