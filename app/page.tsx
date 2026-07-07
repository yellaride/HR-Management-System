import Image from "next/image";
import Link from "next/link";
import LoginForm from "./components/LoginForm";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg-base,#fafafa)] text-[var(--color-content-main)]">
      
      {/* Header Navigation - Decreased vertical height & aligned */}
      <header className="w-full py-3 px-6 md:px-12 border-b border-slate-100 dark:border-slate-800/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-brand-accent)] text-white flex items-center justify-center font-black text-lg shadow-sm transition-transform group-hover:scale-105 duration-200">
              V
            </div>
            <span className="font-bold text-lg tracking-tight text-[var(--color-content-main)]">
              VibeFlow<span className="text-[var(--color-brand-accent)]">.</span>
            </span>
          </div>
          <div />
        </div>
      </header>

      {/* Main Content Split Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 py-6 lg:py-10 flex flex-col justify-center">
        {/* items-stretch ensures the left and right columns share the same height */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-stretch">
          
          {/* Left Side: Modern Visual Hero Panel - Size matches the login container height */}
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
              {/* Rich gradient overlay for text contrast */}
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
                Streamlining productivity and collaboration.
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

          {/* Right Side: Gateway / Portal Action Panel */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-900/40 p-8 md:p-10 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-lg shadow-slate-100/50 dark:shadow-none">
              
              <LoginForm />

            </div>
          </div>

        </div>
      </main>

      
    </div>
  );
}