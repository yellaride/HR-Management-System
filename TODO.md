# TODO

## Phase 1 — Header consistency (Admin + Employee pages)
- [ ] Create a shared `PageHeader` component in `app/components/shared/PageHeader.tsx` with consistent typography, spacing, and badge/category label styling.
- [ ] Update Admin pages to use this shared `PageHeader` for: Dashboard, Employees, Leave Manager, Leaves Policy, Activity, Payslips.
- [ ] Update Employee pages (Dashboard and any other header pages) to use the shared `PageHeader`.
- [ ] Ensure all headers use the same font weight, size, tracking, colors, and alignment (left/top) and consistent responsive behavior.
- [ ] Keep existing page-specific search/input areas, but align them to the shared header layout (same baseline/padding/border).
- [ ] Replace any hardcoded color hex values in header areas with CSS vars from `globals.css`.

## Phase 2 — Visual regression / testing
- [ ] Run `npm run lint` and `npm run build` (or `next build`) to ensure no TS/React errors.
- [ ] Manually verify UI consistency for each route.

