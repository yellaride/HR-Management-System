# Planned work: GeneratePayslip modal input + dropdown styling fix

## Information gathered
- `app/components/admin/GeneratePayslipModal.tsx` uses hardcoded Tailwind classes for inputs/selects, including `focus:ring-brand-accent/...` and `focus:border-purple-500` and includes `bg-indigo-*` on the “Calculated Net Pay” pill.
- `app/globals.css` defines Tailwind utilities via `@utility` such as `form-input` and `form-input-with-icon`, but `GeneratePayslipModal.tsx` is not using them.
- Issue described by user: in the `GeneratePayslip` modal, inputs/selects are not using global `form-input` styling, and dropdown design shows as blue (likely indigo/purple ring or browser default option styling).

## Plan
1. Update `app/components/admin/GeneratePayslipModal.tsx`:
   - Replace the `className` on all `<input>` and `<select>` elements inside this modal with the global utility `form-input` / `form-input-with-icon` so the modal matches the app theme.
   - Ensure disabled input (`jobTitle`) uses a disabled-friendly variant via Tailwind (e.g. `disabled:cursor-not-allowed disabled:opacity-70`) while still keeping `form-input` base.
   - Remove `bg-indigo-*` from the calculated net pay pill if it contributes to the “blue” look (replace with brand-subtle / neutral token colors).
   - Set `select` caret/appearance/option styling classes so the dropdown menu doesn’t inherit browser-blue or indigo focus styles.

2. Update `app/globals.css` (if needed):
   - Add utilities for select dropdown styling (where Tailwind can style the select element but not native options reliably). Provide a consistent look for the select control (border/ring/text/background).

3. Test visually:
   - Open the Admin Payslips page.
   - Open “Record Payment” modal.
   - Verify input/select controls use the purple theme and dropdown doesn’t appear blue.

## Dependent files to edit
- `app/components/admin/GeneratePayslipModal.tsx`
- `app/globals.css` (only if we need extra dropdown/select utilities)

## Followup steps
- Run `npm run dev` (if not already running) and check the modal styling.
- Optionally run `npm run lint` / `npm run typecheck` to ensure no TS errors.


