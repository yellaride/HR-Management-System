# HR Management System

Production HR portal built with Next.js (App Router), MongoDB (Mongoose) and NextAuth.

## Features

- **Admin portal**: employee directory, attendance timesheets (shift rules, grace period, auto check-out, monthly locking), leave approvals with balance tracking, leave policies (global + per-employee), payslip generation with versioning and PDF download, birthday tracker with automated emails, activity log, company settings.
- **Employee portal**: check-in/check-out, attendance history, leave requests with live balances, payslip downloads, profile management (Cloudinary photos), birthday greeting.
- **Auth**: NextAuth (JWT credentials), role-based access (`admin` / `employee`), tokenVersion-based global session invalidation, password reset via Resend email.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript (strict)
- MongoDB Atlas via Mongoose
- NextAuth v4 (credentials + JWT)
- Tailwind CSS v4
- Cloudinary (profile photos), Resend (transactional email)
- Vercel cron (`vercel.json`) for daily birthday emails

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in all values.
3. `npm run dev`

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm start` — run production build
- `npm run lint` — ESLint

## Deployment (Vercel)

1. Push to GitHub and import the repo in Vercel.
2. Set all environment variables from `.env.example` in Vercel Project Settings (set `NEXTAUTH_URL` to your production domain).
3. The birthday cron (`/api/admin/birthdays/cron`, daily 04:00 UTC = 09:00 PKT) registers automatically; Vercel sends `Authorization: Bearer $CRON_SECRET` with each invocation.
4. In MongoDB Atlas allow network access for Vercel (0.0.0.0/0) and enable backups.
