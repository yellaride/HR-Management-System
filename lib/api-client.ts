/**
 * Shared JSON fetcher for SWR. Throws on non-2xx so SWR surfaces `error`,
 * and attaches the HTTP status so pages can special-case 401/403.
 */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetcher<T>(url: string): Promise<T> {
  // no-store: personal HR data must never persist in the browser HTTP cache;
  // freshness/caching is handled entirely by the SWR layer in memory.
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      // non-JSON error body — keep generic message
    }
    throw new ApiError(message, res.status);
  }

  return res.json() as Promise<T>;
}
