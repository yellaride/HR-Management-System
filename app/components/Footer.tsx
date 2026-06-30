import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full py-6 px-4 sm:px-6 border-t border-line-subtle bg-surface-card/50 mt-10">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-content-muted">
        <div>© {new Date().getFullYear()} VibeFlow Inc. All secure rights reserved.</div>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-content-secondary transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-content-secondary transition-colors">
            Terms of Service
          </Link>
          <Link href="/status" className="hover:text-content-secondary transition-colors">
            System Status
          </Link>
        </div>
      </div>
    </footer>
  );
}

