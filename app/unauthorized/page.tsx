"use client";

import { useRouter } from "next/navigation";

export default function Unauthorized() {
  const router = useRouter();

  return (
    <main className="flex items-center justify-center min-h-screen bg-surface-main p-6 font-sans">
      <div className="max-w-[440px] w-full bg-surface-card rounded-2xl border border-line-subtle shadow-lg shadow-[#181124]/5 px-8 py-10 text-center">
        
        {/* Lock Icon Wrapper */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-subtle mb-6">
          <svg
            className="w-7 h-7 stroke-brand-accent"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        {/* Error Code */}
        <span className="block text-[13px] font-bold text-brand-accent uppercase tracking-widest mb-2">
          Error 403
        </span>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-content-main mb-3 tracking-tight">
          Access Denied
        </h1>

        {/* Paragraph Description */}
        <p className="text-[15px] leading-relaxed text-content-secondary mb-8">
          You do not have permission to access this page. Please ensure you are signed in with the correct credentials or contact your administrator.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push("/")}
            className="w-full bg-brand-accent text-white text-[15px] font-semibold py-3 px-6 rounded-lg cursor-pointer transition-colors duration-200 ease-in-out hover:bg-brand-hover focus:outline-none"
          >
            Go to Homepage
          </button>

          <button
            onClick={() => router.back()}
            className="w-full bg-transparent text-content-secondary text-[15px] font-semibold py-3 px-6 rounded-lg border border-line-subtle cursor-pointer transition-all duration-200 ease-in-out hover:bg-surface-main hover:text-content-main focus:outline-none"
          >
            Go Back
          </button>
        </div>
      </div>
    </main>
  );
}