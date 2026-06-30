# TODO - MongoDB connection fix

- [ ] Update `lib/mongodb.ts` to use standard MongoClient connection options and add clear, non-secret validation/errors.
- [ ] Update `app/api/test-db/route.ts` to return safe diagnostics (presence/shape of env var, connection stage) without exposing credentials.
- [ ] Re-run `app/api/test-db` to confirm whether the error is DNS/URI-related vs network/IP whitelisting.
- [ ] If still failing: verify Atlas IP whitelist + user permissions + correct connection string (SRV/TLS) + your runtime env (.env vs .env.local).

