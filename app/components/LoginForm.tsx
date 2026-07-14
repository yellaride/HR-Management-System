"use client";

import { useState } from "react";
import Link from "next/link";
import { getSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export interface LoginFormProps {
  // role prop removed to make login role-neutral
}

export default function LoginForm() {
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
      });

      if (res?.error) {
        const errMsg = String(res.error || "");
        const looksLikeServerDown =
          /ECONNREFUSED|ECONNRESET|MongoNetworkError|MongoError|timed out|failed to connect|Service unavailable/i.test(errMsg);

        if (looksLikeServerDown) {
          setError("The authentication server is currently unreachable. Please try again shortly.");
        } else {
          setError(errMsg || "Invalid email address or password. Please verify and try again.");
        }

        setLoading(false);
        return;
      }

      const session = await getSession();
      const actualRole = session?.user?.role?.toString().toLowerCase();

      if (!actualRole) {
        setError("Role verification failed. Please contact your system administrator.");
        setLoading(false);
        return;
      }

      if (actualRole === "admin") {
        router.push("/admin/dashboard");
      } else if (actualRole === "employee") {
        router.push("/employee/dashboard");
      } else {
        await signOut({ redirect: false });
        setError("Your account role is not recognized. Please contact your system administrator.");
        setLoading(false);
        return;
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
        
        {/* Unified Modern Title & Subtitle */}
        <div className="min-h-[82px] flex flex-col justify-start">
          <h2 className="text-xl md:text-2xl font-bold text-[var(--color-content-main)] tracking-tight leading-none">
            Workspace Access
          </h2>
          <p className="mt-2 text-xs md:text-sm text-[var(--color-content-secondary)] leading-relaxed font-normal opacity-90">
            Verify your corporate credentials to sign into your secure workplace station.
          </p>
        </div>

        {/* User-Friendly Error Notifications */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs font-semibold leading-relaxed">
            <svg className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Input Fields using Semantic Global Classes */}
        <div className="space-y-4">
          <div>
            <label className="field-label block mb-1.5">
              Email Address
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

          <div>
            <label className="field-label block mb-1.5">
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
                className="form-input auth-input-focus pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[var(--color-content-muted)] hover:text-[var(--color-content-secondary)] transition-colors focus:outline-none cursor-pointer"
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

        {/* Options Row */}
        <div className="flex items-center justify-between text-xs font-medium">
          <label className="flex items-center gap-2 text-[var(--color-content-secondary)] cursor-pointer select-none">
            <input
              type="checkbox"
              disabled={loading}
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-[var(--color-line-subtle)] text-[var(--color-brand-accent)] focus:ring-[var(--color-brand-accent)] w-4 h-4 transition cursor-pointer"
            />
            <span>Remember device</span>
          </label>
          <Link href="/forgot-password" className="text-[var(--color-brand-accent)] hover:underline font-semibold transition">
            Forgot password?
          </Link>
        </div>

        {/* Unified Submit Button using Global Brand Utility */}
        <button
          type="submit"
          disabled={loading}
          className="btn-brand-filled cursor-pointer"
        >
          {loading ? (
            <span>Signing in...</span>
          ) : (
            <>
              <svg className="w-4.5 h-4.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>
    </>
  );
}