# TODO - Employee image fallback (Admin)

- [ ] Unify avatar fallback logic across:
  - [ ] app/components/admin/employees/EmployeeTable.tsx
  - [ ] app/components/admin/employees/ViewEmployeeModal.tsx
- [ ] Ensure avatar shows initials ONLY when image value is missing/empty/invalid.
- [ ] Add basic `onError` handling for broken images.
- [ ] If EmployeeTable/ViewEmployeeModal currently uses different checks, refactor to the same helper.
- [ ] Run `npm test` / `npm run lint` (or `npm run build`) to verify compilation.

