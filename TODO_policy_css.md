# TODO: Leaves Policy page global CSS alignment

- [x] Inspect leaves policy page and modal components for hardcoded button/colors.
- [ ] Refactor buttons in `app/(admin)/admin/leaves-policy/page.tsx` to use global utility classes from `app/globals.css` (e.g., `btn-brand-filled`, `btn-outline`, `btn-ghost`).
- [ ] Refactor action buttons inside the table row to match global button utilities (brand/outline/ghost) and remove hardcoded indigo/rose styles where possible.
- [ ] Refactor modal buttons inside `app/components/admin/ManageLeavePolicyModal.tsx` to use the same global button utilities.
- [ ] Verify no visual regressions / ensure Tailwind classes reference valid utilities.
- [ ] Run `npm run lint` and `npm run build` if available.

