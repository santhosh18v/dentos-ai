# DentOS AI — Session Handoff (v11)

> **Deployment COMPLETE.** App is live, seeded, and smoke-tested.
> Paste this into a new chat to resume. Say: **"Resume DentOS AI — read handoff v11."**

---

## LIVE URLS
- App: https://dentos-ai.onrender.com
- Login: admin@smilecare.com / admin123
- Public page: https://dentos-ai.onrender.com/c/smilecare

## PLATFORMS
- Hosting: Render (free web service, spins down after inactivity ~50s cold start)
  - Service ID: srv-d8t5p9navr4c738rl5og
  - Repo: github.com/santhosh18v/dentos-ai, branch main, auto-deploy ON
  - Region: Singapore. Node 24.14.1.
- Database: Neon (free forever, serverless Postgres 18, Singapore)
  - Project: dentos-ai, Project ID: bitter-lake-03990709
  - DATABASE_URL is in Render env vars only (NOT in code)

## RENDER ENV VARS (in dashboard, NOT in code)
- DATABASE_URL = postgresql://neondb_owner:...@...neon.tech/neondb?sslmode=require (updated June 23)
- JWT_SECRET = (regenerated June 23 — old one was exposed in chat)
- NODE_ENV = production

## CURRENT package.json SCRIPTS
```json
"scripts": {
  "dev": "next dev",
  "build": "next build --webpack",
  "start": "next start",
  "lint": "eslint",
  "postinstall": "prisma generate"
}
```

## KEY FILES ADDED DURING DEPLOYMENT
- prisma.config.ts — Prisma 7 CLI config with datasource.url
- prisma/setup-neon.ts — one-time script to create clinic/users/services on Neon

## DEPLOYMENT FIXES APPLIED (for reference)
1. next build --webpack — bypasses Turbopack root-inference bug on Render
2. tailwindcss + @tailwindcss/postcss moved to dependencies (Render skips devDeps)
3. prisma CLI + @prisma/client + @prisma/adapter-pg in dependencies
4. prisma.config.ts with datasource.url for prisma migrate deploy
5. Migrations run manually: DATABASE_URL="postgresql://..." npx prisma migrate deploy
6. start script = just "next start" (no migrate — done once via local terminal)
7. DATABASE_URL in Render updated to postgresql:// format (was postgres://)

## DATABASE STATE (Neon — LIVE)
- Clinic: clinic001 — SmileCare Dental (slug "smilecare", whatsapp "+91 90147 43783")
- Users: admin@smilecare.com / reception@smilecare.com / dentist@smilecare.com
- Patients: 28 SEED- demo patients + SMC-001 Santhosh + SMC-002 Sreeraaz
- Services: 10 (Cleaning, Root Canal, Filling, Extraction, Crown, etc.)
- All 9 migrations applied

## STACK
Next.js 16.2.9, TypeScript, Tailwind v4, Shadcn UI, Prisma 7.8.0 + @prisma/adapter-pg,
PostgreSQL (Neon 18), JWT/jose/bcryptjs, jspdf, recharts.
Local: MacBook Air (Apple Silicon), Node v26.3.0.

## TODO (next priorities)
1. httpOnly server-set cookie (currently client-set — XSS risk) — #1 security item
2. WhatsApp webhook: verify Meta X-Hub-Signature-256
3. Delete SEED- demo patients before real clinic onboarding
4. Show 2-min demo to 1-2 real dentists — customer validation is UNPROVEN
5. Optional: custom domain

## CRITICAL RULES (carried forward)
- PRISMA 7: no url in schema.prisma. prisma.config.ts handles it.
- NEXT 16: use --webpack for builds (Turbopack breaks on Render)
- RENDER: devDeps skipped — build-time deps must be in dependencies
- DATABASE_URL prefix must be postgresql:// not postgres:// for Prisma CLI
- Local .env uses local Postgres; Render env vars use Neon — never mix

## RESUME PROMPT
Resume DentOS AI — read handoff v11.
App is fully live at https://dentos-ai.onrender.com.
Neon DB is seeded (clinic001, 3 users, 10 services, 30 patients).
Next priorities: httpOnly cookie (XSS hardening), WhatsApp webhook signature,
delete SEED- patients before real onboarding, show demo to real dentists.
