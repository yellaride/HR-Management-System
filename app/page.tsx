"use client";

import LoginForm from "./components/LoginForm";

// Inline Left Vector Illustration
function LeftIllustration() {
  return (
    <svg viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto drop-shadow-md">
      {/* Desk Base */}
      <rect x="50" y="320" width="400" height="12" rx="6" fill="#e2e8f0" />
      <rect x="90" y="332" width="12" height="50" fill="#cbd5e1" />
      <rect x="398" y="332" width="12" height="50" fill="#cbd5e1" />
      
      {/* Monitor Base & Display */}
      <rect x="180" y="180" width="140" height="100" rx="10" fill="#0f172a" />
      <rect x="188" y="188" width="124" height="84" rx="6" fill="#38bdf8" fillOpacity="0.15" />
      <rect x="235" y="280" width="30" height="30" fill="#94a3b8" />
      <rect x="210" y="310" width="80" height="10" rx="5" fill="#64748b" />
      
      {/* UI Elements on Display */}
      <rect x="200" y="200" width="45" height="25" rx="4" fill="#0093c4" />
      <rect x="252" y="200" width="48" height="25" rx="4" fill="#0284c7" fillOpacity="0.4" />
      <circle cx="215" cy="245" r="12" fill="#0093c4" />
      <rect x="235" y="240" width="55" height="6" rx="3" fill="#cbd5e1" />
      <rect x="235" y="250" width="35" height="6" rx="3" fill="#e2e8f0" />

      {/* Plant Pot */}
      <path d="M 80 320 L 90 270 L 120 270 L 130 320 Z" fill="#0093c4" />
      <path d="M 105 270 C 80 230, 60 210, 75 190 C 95 210, 100 240, 105 270 Z" fill="#10b981" />
      <path d="M 105 270 C 130 230, 150 210, 135 190 C 115 210, 110 240, 105 270 Z" fill="#059669" />

      {/* Floating Badges */}
      <g className="animate-bounce" style={{ animationDuration: '3s' }}>
        <rect x="320" y="120" width="110" height="60" rx="12" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
        <circle cx="345" cy="150" r="12" fill="#10b981" fillOpacity="0.2" />
        <path d="M 340 150 L 344 154 L 352 145" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="365" y="140" width="50" height="8" rx="4" fill="#0f172a" />
        <rect x="365" y="153" width="35" height="6" rx="3" fill="#94a3b8" />
      </g>

      <g className="animate-pulse" style={{ animationDuration: '4s' }}>
        <rect x="70" y="100" width="100" height="55" rx="12" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
        <rect x="85" y="115" width="40" height="8" rx="4" fill="#0093c4" />
        <rect x="85" y="130" width="65" height="6" rx="3" fill="#cbd5e1" />
      </g>
    </svg>
  );
}

// Inline Right Vector Illustration
function RightIllustration() {
  return (
    <svg viewBox="0 0 500 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto drop-shadow-lg">
      {/* Lounge Chair Backing */}
      <path d="M 120 380 C 100 280, 180 180, 320 180 C 420 180, 450 280, 430 380 Z" fill="#ffffff" fillOpacity="0.15" />
      <path d="M 140 370 C 130 290, 200 210, 310 210 C 400 210, 420 290, 400 370 Z" fill="#ffffff" fillOpacity="0.2" />

      {/* Character Seated */}
      <path d="M 220 320 Q 280 370 360 350 L 370 380 Q 270 400 200 340 Z" fill="#0f172a" />
      <rect x="360" y="340" width="40" height="20" rx="8" fill="#fbbf24" />

      {/* Torso & Head */}
      <rect x="210" y="210" width="80" height="100" rx="20" fill="#fbbf24" />
      <circle cx="250" cy="170" r="28" fill="#fde047" />
      <path d="M 230 155 C 240 140, 270 140, 275 160 C 260 160, 240 165, 230 155 Z" fill="#0f172a" />

      {/* Tablet Display */}
      <rect x="180" y="230" width="90" height="60" rx="8" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />
      <rect x="188" y="238" width="74" height="44" rx="4" fill="#38bdf8" />
      <line x1="195" y1="250" x2="235" y2="250" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <line x1="195" y1="262" x2="220" y2="262" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <circle cx="248" cy="256" r="8" fill="#ffffff" fillOpacity="0.6" />

      {/* Arms */}
      <path d="M 220 230 Q 180 250 190 270" stroke="#fbbf24" strokeWidth="16" strokeLinecap="round" />
      <path d="M 280 230 Q 290 270 260 280" stroke="#fbbf24" strokeWidth="16" strokeLinecap="round" />

      {/* Accent Shapes */}
      <circle cx="140" cy="140" r="5" fill="#ffffff" />
      <circle cx="380" cy="120" r="7" fill="#fde047" />
      <circle cx="410" cy="150" r="4" fill="#ffffff" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen w-full bg-white font-sans antialiased flex flex-col lg:h-screen lg:overflow-hidden">
      
      {/* Top Header */}
      <header className="relative z-30 w-full flex items-center justify-between px-4 sm:px-8 lg:px-12 2xl:px-16 py-2.5 sm:py-3 lg:py-4 xl:py-5 shrink-0 border-b border-slate-100/80">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 xl:w-11 xl:h-11 rounded-xl bg-[#0093c4] text-white flex items-center justify-center font-bold text-base sm:text-lg xl:text-xl shadow-md shadow-[#0093c4]/25">
            S
          </div>
          <span className="text-xl sm:text-2xl xl:text-3xl font-bold tracking-tight text-slate-900">
            Syncup<span className="text-[#0093c4]">.</span>
          </span>
        </div>

        {/* Header Utility Controls */}
        <div className="flex items-center gap-2 sm:gap-3 xl:gap-4">
          
          {/* System Status */}
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 xl:px-4 xl:py-2 rounded-full bg-slate-100/80 border border-slate-200/80 text-xs sm:text-sm xl:text-base font-semibold text-slate-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Systems Normal</span>
          </div>

          {/* Support Link */}
          <a
            href="#support"
            className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 xl:px-4 xl:py-2 rounded-full bg-white border border-slate-200 text-xs sm:text-sm xl:text-base font-semibold text-slate-700 hover:text-[#0093c4] hover:border-[#0093c4]/40 shadow-sm transition-all"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 xl:w-4.5 xl:h-4.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Support</span>
          </a>

          {/* Version Tag */}
          <span className="px-3 py-1 sm:px-3.5 sm:py-1.5 xl:px-4 xl:py-2 rounded-full bg-[#0093c4]/10 text-[#0093c4] border border-[#0093c4]/20 text-xs sm:text-sm xl:text-base font-semibold">
            v2.4
          </span>

        </div>

      </header>

      {/* Main Split Layout */}
      <div className="relative flex-1 flex flex-col lg:flex-row w-full min-h-0">
        
        {/* Left Half (White Background) */}
        <div className="relative w-full lg:w-1/2 bg-white flex flex-col justify-center items-center lg:items-start p-4 sm:p-6 lg:pl-8 xl:pl-14 2xl:pl-20 overflow-hidden">
          <div className="relative z-10 w-full max-w-[200px] sm:max-w-[240px] md:max-w-[280px] lg:max-w-[320px] xl:max-w-[440px] 2xl:max-w-[560px]">
            <LeftIllustration />
          </div>
        </div>

        {/* Right Half (Teal Accent Background) */}
        <div className="relative w-full lg:w-1/2 bg-gradient-to-br from-[#0093c4] to-[#0078a0] flex flex-col justify-center items-center lg:items-end p-4 sm:p-6 lg:pr-8 xl:pr-14 2xl:pr-20 overflow-hidden">
          <div className="relative z-10 w-full max-w-[200px] sm:max-w-[240px] md:max-w-[280px] lg:max-w-[320px] xl:max-w-[440px] 2xl:max-w-[560px]">
            <RightIllustration />
          </div>
        </div>

        {/* Centered Floating Form Box */}
        <div className="relative lg:absolute lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 z-20 w-full max-w-sm sm:max-w-md xl:max-w-lg 2xl:max-w-xl px-4 py-6 lg:p-0 my-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 xl:p-10 2xl:p-12 border border-slate-100 shadow-2xl shadow-slate-900/10">
            <LoginForm />
          </div>
        </div>

      </div>

    </div>
  );
}