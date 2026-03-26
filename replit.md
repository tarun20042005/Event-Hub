# Workspace

## Overview

Full-stack Event Management and Ticketing Platform built with React + Vite (frontend) and Express (backend) in a pnpm monorepo.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS (artifacts/event-platform)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Authentication**: express-session + bcryptjs (session-based)
- **QR Codes**: qrcode npm package
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── event-platform/     # React + Vite frontend (preview at /)
│   └── api-server/         # Express API server (at /api)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/
│           ├── users.ts    # Users table (attendee/organizer roles)
│           ├── events.ts   # Events table
│           └── bookings.ts # Bookings table with QR code storage
└── scripts/
```

## Application Features

### User Roles
- **Attendee**: Browse/search events, book tickets, view booking history with QR codes
- **Organizer**: Create/manage events, view event bookings, scan QR codes to mark payment

### Test Accounts (password: `password123`)
- Attendee: `alice@example.com` or `bob@example.com`
- Organizer: `organizer@example.com` or `musicfest@example.com`

### API Routes
- `POST /api/auth/register` — Register (role: attendee/organizer)
- `POST /api/auth/login` — Login with role selection
- `GET /api/auth/me` — Current user session
- `GET /api/events` — List events (with ?search= and ?date= filters)
- `GET /api/events/my` — Organizer's own events
- `POST /api/events` — Create event (organizer)
- `PUT/DELETE /api/events/:id` — Update/delete event (organizer, owns event)
- `GET /api/events/:id/bookings` — Event's bookings (organizer)
- `GET /api/bookings` — User's bookings
- `POST /api/bookings` — Book tickets, generates QR code
- `POST /api/bookings/:id/scan` — Mark payment as Paid (organizer)

### Frontend Pages
- `/` — Home/Events listing with search and date filter
- `/login` — Login with Attendee/Organizer tab selector
- `/register` — Registration with role selection
- `/events/:id` — Event details + book tickets
- `/my-bookings` — Attendee booking history with QR codes
- `/organizer/dashboard` — Organizer's events list
- `/organizer/events/new` — Create new event
- `/organizer/events/:id/edit` — Edit event
- `/organizer/events/:id/bookings` — View event bookings
- `/organizer/scan` — Simulate QR scan to mark payment as paid

## Database Schema

### users
- id, name, email, password (hashed), role (attendee/organizer), created_at

### events
- id, title, description, date, time, location, price (INR), organizer_id, created_at

### bookings
- id, user_id, event_id, ticket_count, total_price (INR), payment_status (Pending/Paid), qr_code_data (base64 PNG), created_at

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. Always typecheck from the root.

## Package Notes

- `pnpm run typecheck` — full typecheck
- `pnpm run db:push` — push schema changes to database
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client from openapi.yaml

## Local Development (VS Code)

1. Copy `.env.example` to `.env` and fill in your `DATABASE_URL` from Neon
2. Run `pnpm install` to install all dependencies
3. Run `pnpm dev` to start both servers concurrently:
   - API server → http://localhost:8080
   - Frontend → http://localhost:5173
4. Use VS Code tasks (`Ctrl+Shift+B`) to start individual servers

### Required Environment Variables
- `DATABASE_URL` — Neon PostgreSQL connection string
- `PORT` — set automatically by `pnpm dev` (8080 for API, 5173 for frontend)
- `BASE_PATH` — set to `/` automatically by `pnpm dev`
- `SESSION_SECRET` — optional, defaults to a dev value
