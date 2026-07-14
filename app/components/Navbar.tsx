import Link from "next/link";

export default function Navbar() {
  return (
    <header className="w-full py-5 px-4 sm:px-6 border-b border-line-subtle bg-surface-card/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-brand-accent flex items-center justify-center text-white font-bold text-lg shadow-sm">
            V
          </div>
          <Link href="/" className="font-bold text-lg tracking-tight text-content-main">
            SYNCUP<span className="text-brand-accent">.</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/employee-portal"
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-line-subtle bg-surface-main hover:bg-surface-card transition"
          >
            Employee
          </Link>
          <Link
            href="/admin-portal"
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-brand-accent text-white hover:opacity-90 transition"
          >
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}

