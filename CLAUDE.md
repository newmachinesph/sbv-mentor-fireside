# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SBV Mentor is a mentor-matching and session-booking platform for the SBV 11-week SaaS Bootcamp (mentor.sbv.one). It connects individuals with expert mentors across six expertise categories: technical, product, business, growth, design, and fundraising. Part of the broader SBV Platform ecosystem alongside Z1 Forge (z1.sbv.one) and The Pitch (pitch.sbv.one).

## Commands

```bash
npm run dev          # Start dev server (Next.js on localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint (flat config, Next.js core-web-vitals + typescript rules)
npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push schema to database
npm run db:migrate   # Run Drizzle migrations
npm run db:studio    # Open Drizzle Studio
```

Add shadcn/ui components:
```bash
npx shadcn@latest add <component-name>
```

## Tech Stack

- **Framework:** Next.js 16 with App Router, React 19, TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS 4 via `@tailwindcss/postcss`, CSS variables for theming
- **UI Components:** shadcn/ui (new-york style, lucide icons, RSC-enabled)
- **Database:** Neon PostgreSQL via Drizzle ORM (`@neondatabase/serverless` HTTP driver)
- **Auth:** NextAuth v5 (beta) with Credentials provider, JWT session strategy
- **Validation:** Zod for API input validation
- **Email:** Nodemailer with HTML templates (SMTP via `mail.bullrun.one`)
- **File Uploads:** UploadThing (avatar uploads)
- **Utilities:** `clsx` + `tailwind-merge` via `cn()` helper in `src/lib/utils.ts`, `nanoid` for IDs

## Architecture

### Database Schema (`src/server/db/schema.ts`)

5 tables with Drizzle ORM:
- **users** — id (nanoid), name, email (unique), passwordHash, role (enum: member/mentor/admin/moderator), avatar, bio
- **mentorProfiles** — id, userId (FK→users, unique), title, company, bio, expertise (json), skills (json), rating, totalSessions, featured, socialLinks (json), location, languages (json), sessionFormat
- **availabilitySlots** — id, mentorProfileId (FK), date, startTime, endTime, booked, bookedByUserId (FK)
- **bookings** — id, mentorProfileId (FK), userId (FK), availabilitySlotId (FK), date, startTime, endTime, topic, description, status (enum: upcoming/completed/cancelled), notes, rating, meetingLink
- **sessionNotes** — id, bookingId (FK), content, actionItems (json: {text, completed}[])

3 enums: `userRoleEnum`, `bookingStatusEnum`, `expertiseCategoryEnum`

DB connection in `src/server/db/index.ts` using Neon HTTP client.

### Auth (`src/server/auth/index.ts`)

NextAuth v5 with Credentials provider (email/password, bcryptjs). JWT session strategy with `id` and `role` injected into session/token. Session types augmented in `src/types/next-auth.d.ts`.

Route protection via `src/middleware.ts`:
- **Public:** `/`, `/login`, `/register`, `/mentors`, `/mentors/[id]`, `/api/auth/*`, `GET /api/mentors*`
- **Protected:** `/bookings`, `/dashboard`, POST/PUT/DELETE API routes
- **Admin-only:** `/admin/*`, `/api/admin/*`

### API Routes

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth handlers |
| `/api/auth/register` | POST | User registration (sends welcome email) |
| `/api/mentors` | GET, POST | List mentors (paginated, filterable), create (admin) |
| `/api/mentors/[id]` | GET, PUT, DELETE | Single mentor profile + availability |
| `/api/mentors/[id]/availability` | GET, POST, DELETE | Manage mentor time slots |
| `/api/bookings` | GET, POST | List user bookings, create booking (atomic slot marking, sends email) |
| `/api/bookings/[id]` | GET, PUT, DELETE | Booking detail, cancel/rate/update (cancel sends email), delete (admin) |
| `/api/bookings/[id]/notes` | GET, POST | Session notes CRUD |
| `/api/dashboard` | GET | Aggregated dashboard data (stats, sessions, notes, progress, recommendations) |
| `/api/admin/users` | GET, PUT | List users, change roles (admin) |
| `/api/admin/mentors` | GET, POST | List/create mentor profiles (admin) |
| `/api/uploadthing` | GET, POST | UploadThing file upload handler |

### Routing (Next.js App Router)

All pages in `src/app/`:
- `/` — Landing page (Server Component)
- `/login`, `/register` — Auth pages under `(auth)` route group
- `/mentors` — Browse/search/filter mentors with pagination (Client Component, fetches API)
- `/mentors/[id]` — Mentor profile with real availability + booking flow
- `/bookings` — Tabbed view of upcoming/completed/cancelled (Client Component, fetches API)
- `/bookings/[id]` — Booking detail with interactive session notes
- `/dashboard` — User dashboard with stats, upcoming sessions, notes, progress, recommendations

### Key Patterns

- **Next.js 16 dynamic params are Promises:** Route handlers use `{ params }: { params: Promise<{ id: string }> }` and `const { id } = await params`
- **`useSearchParams()` requires Suspense:** Components using `useSearchParams` must be wrapped in `<Suspense>`
- **Atomic booking:** POST `/api/bookings` first UPDATEs the slot to `booked=true` (WHERE booked=false), then INSERTs the booking. If the UPDATE returns nothing, the slot is already taken (409).
- **Non-blocking emails:** Email sends use fire-and-forget `.catch()` to avoid blocking API responses
- **Roles:** `member` (default), `mentor`, `admin`, `moderator`. Admin can do everything. Moderator can view admin lists but not change roles.
- **JSON columns:** expertise, skills, socialLinks, languages, actionItems stored as JSON in PostgreSQL

### Email (`src/server/email/`)

Nodemailer transport in `index.ts`. HTML templates in `templates/`:
- `welcome.tsx` — Sent on registration
- `booking-confirmation.tsx` — Sent on booking creation
- `booking-cancelled.tsx` — Sent on booking cancellation

### Shared Layout Components

- `src/components/navbar.tsx` — Auth-aware navbar with user dropdown, role badge, mobile sheet
- `src/components/footer.tsx` — Site-wide footer (Server Component)
- `src/app/providers.tsx` — NextAuth `SessionProvider` wrapper

### Validation Schemas (`src/lib/validations/`)

- `auth.ts` — loginSchema, registerSchema
- `mentor.ts` — createMentorSchema, updateMentorSchema, addAvailabilitySchema
- `booking.ts` — createBookingSchema, updateBookingSchema
- `session-notes.ts` — createSessionNoteSchema, updateActionItemSchema

### Theming

Custom "Forest Green" theme in `src/app/globals.css` with CSS custom properties. Brand colors use `--color-sbv-*` tokens. Light and dark mode supported.

### Path Aliases

`@/*` maps to `./src/*` (configured in `tsconfig.json`).

### Fonts

Manrope (primary sans) and Geist Mono loaded via `next/font/google` in root layout.
