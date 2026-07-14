# TODO - Fix hourly rate not shown in Admin employee list

## Plan
- Understand how hourly rate is fetched from backend and mapped to frontend.
- Fix API formatting so the admin employees table receives the correct `HourlyRate`/`hourlyRate` value.
- Fix frontend mapping if it expects a different field name.
- Verify create/edit flows also return the hourly rate consistently.

## Steps
1. Inspect backend `/api/admin/employees` GET response mapping for hourly rate.
2. Inspect frontend `EmployeeTable` usage to confirm expected property name.
3. Apply code changes so the API returns `HourlyRate` (or frontend reads `hourlyRate`).
4. Ensure `/api/admin/employees/[id]` PUT returns hourly rate with the same field naming.
5. Run dev server/build and verify hourly rate displays on admin employee page.

