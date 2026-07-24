# TODO - Fix Leading Zero Stripping in AttendanceSettings Number Inputs

## Completed Steps
- [x] Analyzed the issue: `Number("010")` → `10` strips leading zeros in number inputs
- [x] Planned the fix: Store raw string values for number inputs during editing
- [x] Approved by user

## Remaining Steps
- [ ] Step 1: Add `rawStringValues` state to preserve raw string input
- [ ] Step 2: Modify all 4 number input fields to use raw string values
- [ ] Step 3: Test the fix

