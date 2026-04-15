# App 2 — Seat Mapping Plan (Booking Seat)

Real-time seat booking system for Transcosmos Technical Test.

## What it does

- **Visual floor map** showing all seats with live status colours  
  - 🟢 **Green** = available  
  - 🟠 **Amber** = pending approval  
  - 🔴 **Red** = occupied / approved  
- **Real-time sync** via Supabase — all users see seat state instantly  
- **Booking flow**: select campaign → pick seats → set dates → submit  
- **Admin panel**: approve / reject bookings; floor map updates live for everyone  

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 · TypeScript · Tailwind CSS |
| Database | Supabase (Postgres + Realtime subscriptions) |
| Auth | Session in localStorage (demo) |

## Setup

### 1. Create a Supabase project

1. Go to https://supabase.com → New Project  
2. Open **SQL Editor** → paste and run `supabase/migrations/001_initial.sql`  
3. Copy **Project URL** and **anon public key** from Project Settings → API

### 2. Configure environment

```bash
cp .env.local.example .env.local
# Fill in your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3. Install and run

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Demo accounts

| Role  | Username | Password |
|-------|----------|----------|
| User  | user     | user123  |
| Admin | admin    | admin123 |

## Real-time behaviour

When any user books a seat or admin approves/rejects, the floor map updates for **all connected clients** within ~100 ms via Supabase Postgres Changes — no polling, no page refresh required.

## Key files changed from original repo

| File | Change |
|------|--------|
| `src/app/lib/store.ts` | localStorage → async Supabase CRUD + real-time subscriptions |
| `src/app/lib/supabase.ts` | **New** — Supabase client singleton |
| `src/app/lib/database.types.ts` | **New** — TypeScript types matching DB schema |
| `src/app/components/SeatComponent.tsx` | Green (available) / Red (occupied) colour scheme |
| `src/app/booking/page.tsx` | Async data load + real-time subscription hook |
| `src/app/admin/page.tsx` | Async approve/reject + real-time subscription hook |
| `supabase/migrations/001_initial.sql` | **New** — DB schema, RLS policies, realtime publication |
| `.env.local.example` | **New** — environment variable template |
