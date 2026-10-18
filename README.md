# SBV Mentor

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)

A mentor-matching and session-booking platform built for a SaaS bootcamp. Members browse mentors across six expertise areas (technical, product, business, growth, design, fundraising), book available time slots, and keep session notes and action items. Admins manage users and mentor profiles.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 with shadcn/ui, Neon PostgreSQL via Drizzle ORM, NextAuth v5 (credentials), Zod, Nodemailer (SMTP), UploadThing.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in database, auth, SMTP and UploadThing values
npm run db:push              # create the schema
npm run db:seed              # optional demo data (requires SEED_PASSWORD; wipes existing data)
npm run dev                  # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm run db:generate`, `npm run db:migrate`, `npm run db:studio`.

## Structure

- `src/app/` pages and API routes (auth, mentors, bookings, dashboard, admin, uploadthing)
- `src/components/` UI components
- `src/server/` auth, database schema, email templates
- `src/lib/` validation schemas and utilities
- `scripts/seed.ts` demo data seeder

## License

MIT. See [LICENSE](LICENSE).
