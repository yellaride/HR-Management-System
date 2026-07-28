"use client";

import { useEffect, useRef } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { SWRConfig, useSWRConfig } from "swr";
import { apiFetcher, ApiError } from "@/lib/api-client";

/**
 * Drops every cached SWR entry whenever the signed-in user changes
 * (logout, login, or account switch). Without this, a shared browser could
 * briefly serve the previous user's cached HR data (payslips, team views)
 * to the next user before revalidation returns a 401/403.
 */
function SwrIdentityGuard() {
  const { data: session, status } = useSession();
  const { mutate } = useSWRConfig();

  const userId = session?.user?.id ?? null;
  const prevUserIdRef = useRef(userId);

  useEffect(() => {
    if (status === "loading") return;
    if (prevUserIdRef.current !== userId) {
      prevUserIdRef.current = userId;
      mutate(() => true, undefined, { revalidate: false });
    }
  }, [userId, status, mutate]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    // Poll every 4 minutes (under the server's 5-minute revalidation window) and
    // on window focus. This keeps the JWT cookie refreshed (sliding session) and
    // surfaces SessionExpired via a clean redirect instead of surprise API 403s.
    <SessionProvider refetchInterval={4 * 60} refetchOnWindowFocus>
      {/*
        Global data-fetching cache: pages render instantly from cache on
        revisit while SWR revalidates in the background.
      */}
      <SWRConfig
        value={{
          fetcher: apiFetcher,
          revalidateOnFocus: true,
          dedupingInterval: 10_000,
          keepPreviousData: true,
          errorRetryCount: 2,
          // Client errors (401/403/404...) are deterministic — retrying only
          // wastes requests. Server/network errors keep the default retries.
          shouldRetryOnError: (error) =>
            !(error instanceof ApiError && error.status >= 400 && error.status < 500),
        }}
      >
        <SwrIdentityGuard />
        {children}
      </SWRConfig>
    </SessionProvider>
  );
}
