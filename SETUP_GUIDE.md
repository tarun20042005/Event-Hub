# EventFlow - Local Setup Guide for VS Code

## Prerequisites

Before starting, install:
1. **Node.js** (v18+) - [Download](https://nodejs.org/)
2. **pnpm** - Run: `npm install -g pnpm`
3. **PostgreSQL** (v14+) - [Download](https://www.postgresql.org/download/)

## Step 1: Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd your-repo

# Install all dependencies
pnpm install
```

## Step 2: Setup Database

### Option A: Use PostgreSQL Locally
1. Start PostgreSQL server (it runs automatically after installation)
2. Create a database:
```bash
createdb eventflow
```

### Option B: Use Neon (Free Cloud Database - Recommended for Testing)
1. Go to [Neon.tech](https://neon.tech)
2. Sign up for free and create a PostgreSQL database
3. Copy the connection string (looks like: `postgresql://...`)

## Step 3: Create .env File

Create `artifacts/api-server/.env` with:

```env
# Database Connection
DATABASE_URL=postgresql://username:password@localhost:5432/eventflow

# Session Secret (use any random string)
SESSION_SECRET=your_super_secret_session_key_change_this_in_production_12345

# Server Port
PORT=3001

# Node Environment
NODE_ENV=development
```

### If using Neon instead:
```env
# Get this from your Neon dashboard
DATABASE_URL=postgresql://user:password@ep-xxxx.us-east-1.aws.neon.tech/eventflow

SESSION_SECRET=your_super_secret_session_key_change_this_in_production_12345

PORT=3001

NODE_ENV=development
```

## Step 4: Setup Database Schema

```bash
# Push database schema
pnpm --filter @workspace/db run db:push

# Seed sample data (optional - adds test events & accounts)
pnpm --filter @workspace/db run db:seed
```

## Step 5: Run the Application

### Option A: Run in Two Separate Terminals (Recommended)

**Terminal 1 - Start API Server:**
```bash
pnpm --filter @workspace/api-server run dev
```
✅ API will run on: `http://localhost:3001`

**Terminal 2 - Start Frontend:**
```bash
pnpm --filter @workspace/event-platform run dev
```
✅ Frontend will run on: `http://localhost:5173`

### Option B: Run Both Simultaneously
```bash
# Install concurrently (optional)
pnpm add -D concurrently

# Run both in one command
concurrently "pnpm --filter @workspace/api-server run dev" "pnpm --filter @workspace/event-platform run dev"
```

## Step 6: Access the App

Open in browser:
- **Frontend:** `http://localhost:5173`
- **API:** `http://localhost:3001/api`

## Test Accounts

After seeding, use these credentials:

### Attendees (Password: `password123`)
- **Email:** `alice@example.com`
- **Email:** `bob@example.com`

### Organizers (Password: `password123`)
- **Email:** `organizer@example.com`
- **Email:** `musicfest@example.com`

## Project Structure

```
project-root/
├── artifacts/
│   ├── api-server/          # Express backend
│   │   ├── src/
│   │   ├── .env             # ← Create this file
│   │   └── package.json
│   ├── event-platform/      # React frontend
│   │   ├── src/
│   │   └── package.json
│   └── mockup-sandbox/      # Component preview
├── lib/
│   ├── db/                  # Database schema & migrations
│   ├── api-client-react/    # API client hooks
│   └── api-spec/            # OpenAPI specification
└── pnpm-workspace.yaml      # Monorepo config
```

## Common Commands

```bash
# Run type checking
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/event-platform run typecheck

# Build for production
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/event-platform run build

# View database in UI (optional)
pnpm --filter @workspace/db run studio
```

## Troubleshooting

### Port Already in Use
```bash
# Change port in .env
PORT=3002  # Use different port

# For frontend, Vite will auto-increment port
```

### Database Connection Error
```bash
# Test PostgreSQL connection
psql -U postgres -d eventflow

# Or check PostgreSQL is running (macOS)
brew services list

# Start PostgreSQL (macOS)
brew services start postgresql
```

### Dependencies Not Installing
```bash
# Clear cache and reinstall
pnpm install --force
```

### Hot Reload Not Working
```bash
# Restart dev servers
# Stop with Ctrl+C and run dev command again
```

## Features to Test

1. **Register** as attendee → Browse events → Book ticket → View QR
2. **Scan QR** → See ticket confirmation page
3. **Login** as organizer → Create event with poster → View bookings
4. **Delete booking** → See confirmation
5. **Print ticket** → PDF-friendly view

## Environment Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `SESSION_SECRET` | Encrypts session cookies | Any random string (change in production!) |
| `PORT` | API server port | `3001` |
| `NODE_ENV` | Environment (development/production) | `development` |

## Next Steps

1. Start both servers
2. Open `http://localhost:5173`
3. Register a new account
4. Book an event
5. Scan the QR code to see the ticket

For production deployment, use environment variables in your hosting platform instead of .env file.
