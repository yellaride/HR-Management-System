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
        role, // Pass front-end selected role
      });

      if (res?.error) {
        setError(res.error || "Authentication failed. Please verify your credentials.");
        setLoading(false);
        return;
      }

      // Successful login: Route to respective interfaces
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
      {/* Dynamic performance animation styles */}
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
        
        {/* Dynamic Header with Min-Height to eliminate layout jumping */}
        <div className="min-h-[82px] flex flex-col justify-start">
          <h2 className="text-xl md:text-2xl font-bold text-content-main tracking-tight leading-none">
            {isAdmin ? "Administrative Portal" : "Employee Portal"}
          </h2>
          <p className="mt-2 text-xs md:text-sm text-content-secondary leading-relaxed font-normal opacity-90">
            {isAdmin
              ? "For HR, IT, executive management, and directory coordination access."
              : "Access your paystubs, time off, communication feeds, and personal schedule."}
          </p>
        </div>

        {/* Display Auth Errors */}
        {error && (
          <div className="p-3 text-xs md:text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-content-secondary mb-1.5">
              {isAdmin ? "Admin Identifier / Email" : "Employee Email Address"}
            </label>
            <input
              type="email"
              required
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isAdmin ? "admin@vibeflow.com" : "name@vibeflow.com"}
              className="w-full px-4 py-3 rounded-xl border border-line-subtle bg-surface-main text-content-main focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition text-sm shadow-sm font-normal disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-content-secondary mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-line-subtle bg-surface-main text-content-main focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition text-sm shadow-sm font-normal disabled:opacity-50"
            />
          </div>
        </div>

        {/* Utilities */}
        <div className="flex items-center justify-between text-xs font-medium">
          <label className="flex items-center gap-2 text-content-secondary cursor-pointer select-none">
            <input
              type="checkbox"
              disabled={loading}
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-line-subtle text-brand-accent focus:ring-brand-accent w-4 h-4 transition"
            />
            <span>Remember device</span>
          </label>
          <Link href="#" className="text-brand-accent hover:underline font-semibold transition">
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2.5 shadow-sm disabled:opacity-50 ${
            isAdmin
              ? "bg-purple-900 hover:bg-purple-850 text-white"
              : "bg-brand-accent hover:opacity-90 text-white"
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