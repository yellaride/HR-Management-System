// app/page.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import LoginForm from "./components/LoginForm"; // Adjust path as necessary

export default function Home() {
  const [activeRole, setActiveRole] = useState<"employee" | "admin">("employee");

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-brand-subtle selection:text-brand-accent bg-surface-main">
      
      {/* Header Navigation */}
      <header className="w-full py-5 px-6 md:px-12 border-b border-line-subtle bg-surface-card/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-accent flex items-center justify-center text-white font-bold text-lg shadow-sm">
              V
            </div>
            <span className="font-bold text-lg tracking-tight text-content-main">
              VibeFlow<span className="text-brand-accent">.</span>
            </span>
          </div>
          <div></div>
        </div>
      </header>

      {/* Main Content Split Grid */}
      <main className="flex-grow flex items-center justify-center px-4 py-8 md:py-16 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 w-full items-stretch">
          
          {/* Left Side: Dynamic Background and Feature Info */}
          <div className="lg:col-span-7 flex flex-col justify-between relative rounded-2xl overflow-hidden min-h-[400px] lg:min-h-[550px] p-8 md:p-12 shadow-sm border border-line-subtle bg-surface-card">
            
            {/* Visual Background Layer */}
            <div className="absolute inset-0 z-0">
              <Image 
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80" 
                alt="Collaborative workspace background" 
                fill
                priority
                className="object-cover filter brightness-75 contrast-95"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#181124]/95 via-[#534a60]/85 to-[#7c3aed]/40 mix-blend-multiply" />
            </div>

            {/* Upper Badge */}
            <div className="relative z-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-brand-accent/20 border border-brand-accent/35 text-brand-subtle backdrop-blur-sm uppercase tracking-widest">
                Enterprise Hub
              </span>
            </div>

            {/* Descriptive Content */}
            <div className="relative z-10 mt-auto pt-16">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight max-w-xl">
                Streamlining productivity and collaboration.
              </h1>
              <p className="mt-4 text-base md:text-lg text-brand-subtle max-w-md font-normal leading-relaxed opacity-90">
                Access secure platforms, connect with departments, and optimize your modern workflow in one unified location.
              </p>
              
              <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-6 max-w-sm">
                <span className="text-[10px] text-brand-subtle/80 uppercase tracking-widest font-semibold">
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

          {/* Right Side: Gateway / Portal Action Panel */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="bg-surface-card rounded-2xl border border-line-subtle p-8 md:p-10 shadow-sm">
              
              {/* Premium Sliding Segmented Switch */}
              <div className="relative flex bg-surface-main p-1 rounded-xl mb-8 border border-line-subtle">
                <div 
                  className="absolute top-1 bottom-1 rounded-lg bg-surface-card shadow-sm border border-line-subtle/40 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
                  style={{
                    left: activeRole === "employee" ? "4px" : "50%",
                    right: activeRole === "employee" ? "50%" : "4px",
                  }}
                />
                
                <button
                  type="button"
                  onClick={() => setActiveRole("employee")}
                  className={`relative z-10 flex-1 py-2.5 text-xs font-semibold rounded-lg transition-colors duration-200 ${
                    activeRole === "employee" ? "text-brand-accent" : "text-content-secondary hover:text-content-main"
                  }`}
                >
                  Employee Portal
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRole("admin")}
                  className={`relative z-10 flex-1 py-2.5 text-xs font-semibold rounded-lg transition-colors duration-200 ${
                    activeRole === "admin" ? "text-brand-accent" : "text-content-secondary hover:text-content-main"
                  }`}
                >
                  Admin Portal
                </button>
              </div>

              {/* The "key" prop ensures a clean fade-in animation triggers on switch */}
              <LoginForm key={activeRole} role={activeRole} />

            </div>
          </div>

        </div>
      </main>

      {/* Footer Details */}
      <footer className="w-full py-6 px-6 md:px-12 border-t border-line-subtle bg-surface-card/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-content-muted">
          <div>
            © {new Date().getFullYear()} VibeFlow Inc. All secure rights reserved.
          </div>
          <div className="flex gap-6 font-medium">
            <Link href="/privacy" className="hover:text-content-secondary transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-content-secondary transition-colors">Terms of Service</Link>
            <Link href="/status" className="hover:text-content-secondary transition-colors">System Status</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}