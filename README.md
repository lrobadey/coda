# Coda MVP

A minimal Next.js prototype for Coda, an opportunity tracker.

## Current status

This is an early UI shell running on Next.js:

- Next.js App Router app
- No backend, auth, database, or persistence yet
- No real AI integration yet
- Board, calendar, gallery, navigation, header, and empty states are present
- Opportunities are stored in browser memory only and reset on refresh

## Files

- `app/layout.jsx` — root layout and metadata
- `app/page.jsx` — React UI
- `app/globals.css` — app styling
- `vercel.json` — Vercel config

## Local preview

Install dependencies and run the Next.js dev server:

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Build

```bash
npm run build
```

## Deploy

Import this repository into Vercel and use the repository root as the project root. Vercel will detect Next.js automatically.
