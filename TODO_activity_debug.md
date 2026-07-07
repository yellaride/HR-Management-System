# Activity log fix checklist

## Goal
Ensure activity log returns and displays:
- employee name
- employee designation
- correct mapping (no Unknown User)

## Steps
1. Inspect current API response shape from `/api/admin/activity`.
2. Update `app/api/admin/activity/route.ts` to:
   - resolve employee name + designation reliably from the `ActivityLog.userId` -> `Employee` relationship
   - return `designation` in each log item
3. Update `app/(admin)/admin/activity/page.tsx` to display `log.designation` under `log.user`.
4. Update `app/components/admin/RecentActivityPanel.tsx` if designation should appear there too (optional).
5. Re-run `/admin/activity` and verify designation matches:
   - check-in time entry
   - leave request entries

