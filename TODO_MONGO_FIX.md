# TODO_MONGO_FIX

## Current state
- MongoDB connection still fails with:
  - `querySrv ECONNREFUSED _mongodb._tcp.cluster0.1bmj2pe.mongodb.net`
- The failure is in SRV DNS resolution (`querySrv`), meaning the runtime cannot reach/query the SRV record.

## Next code changes (to implement)
- [ ] Update `lib/mongodb.ts` to remove reliance on custom `dns.setServers(...)` (it may not affect Node 26/Next runtime reliably) and instead:
  - enable mongoose options suitable for retries (e.g. `serverSelectionTimeoutMS`)
  - add explicit timeout-friendly behavior
  - improve error classification and surface hostname/uri scheme checks (without credentials)
- [ ] Update `app/api/test-db/route.ts` to return additional safe diagnostics:
  - whether `process.env.MONGODB_URI` is set
  - whether it looks like `mongodb+srv://`
  - if possible, extract the hostname from the URI and return it
  - return a simplified category: `dns_srv`, `auth`, `format`, `timeout`

## External checks (after code changes)
- [ ] Ensure MongoDB Atlas Network Access allows your current IP (SRV queries must also work from runtime)
- [ ] Ensure your environment truly has the intended `MONGODB_URI` value loaded by Next.
- [ ] If the environment cannot resolve SRV at all, switch the URI to non-SRV:
  - use `mongodb://host1,host2,.../db?...` instead of `mongodb+srv://...`.


