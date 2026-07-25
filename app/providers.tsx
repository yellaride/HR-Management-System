"use client";

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    // Poll every 4 minutes (under the server's 5-minute revalidation window) and
    // on window focus. This keeps the JWT cookie refreshed (sliding session) and
    // surfaces SessionExpired via a clean redirect instead of surprise API 403s.
    <SessionProvider refetchInterval={4 * 60} refetchOnWindowFocus>
      {children}
    </SessionProvider>
  );
}

