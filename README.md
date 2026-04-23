# Regenerative Garden Planner (MVP)

A web-first MVP for permaculture, health-conscious, homesteading growers.

This app lets a user:

- upload a garden photo
- draw planting zones directly on the image
- set orientation (`N/S/E/W`) and ZIP code
- choose plant categories
- generate climate-aware recommendations
- visualize mature-size planting overlays
- drag plants onto the layout to explore alternatives
- view a personalized planting calendar

## Why this is tailored to your audience

The recommendation logic biases for:

- edible crops and culinary/medicinal herbs
- perennial and nitrogen-fixing support plants
- pollinator support species
- companion planting relationships
- avoiding antagonistic pairings

## Stack

- `Next.js` + `React` + `TypeScript`
- Local recommendation engine (no external API required for MVP)
- API boundary via `POST /api/recommend` for easy backend evolution

## Project Structure

- `/app/page.tsx`: main UI, upload + markup + timeline + overlays
- `/app/api/recommend/route.ts`: recommendation endpoint (unchanged in Phase 2)
- `/lib/plants.ts`: plant catalog + `CatalogId` union (catalog is code-owned, not in DB)
- `/lib/climate.ts`: ZIP-based USDA zone approximation + frost dates
- `/lib/recommend.ts`: scoring and placement logic
- `/lib/types.ts`: shared types
- `/lib/db.ts`: Prisma client singleton (Prisma 7 + better-sqlite3 adapter)
- `/lib/schemas.ts`: zod request schemas for all Phase 2 API routes
- `/lib/storage.ts`: local-filesystem photo adapter (swappable for S3)
- `/prisma/schema.prisma`: Phase 2 data model
- `/generated/prisma`: generated Prisma client (gitignored)

## Run locally

Requires Node 20+ (Next 16 drops Node 18 support).

```bash
npm install --legacy-peer-deps
cp .env.example .env
npm run db:migrate   # creates prisma/dev.db and applies migrations
npm run dev
```

Then open `http://localhost:3000`.

### Database scripts

- `npm run db:migrate` — apply pending migrations (dev mode)
- `npm run db:reset` — drop and recreate the SQLite database
- `npm run db:studio` — open Prisma Studio
- `npm run db:generate` — regenerate the Prisma client
- `npm run seed` — run `prisma/seed.ts` (no-op stub for now)

### Environment variables

See `.env.example`. `DATABASE_URL` points at the local SQLite file.
`ANTHROPIC_API_KEY` is required for the chat endpoint (Stage 2+).

## Current MVP Flow

1. Upload a garden-space photo.
2. Draw one or more planting zones by dragging over the image.
3. Set orientation and ZIP code.
4. Choose desired categories.
5. Adjust month slider and click `Generate Smart Layout`.
6. Drag recommendation chips onto the photo to test alternate placements.

## Notes on Climate Accuracy

This MVP currently uses ZIP-prefix heuristics for USDA zone and frost estimates.
For production accuracy, wire in:

- USDA zone datasets by lat/long
- NOAA/NWS historical normals
- high-resolution solar path/shadow models

## Phase 2 pages

| Path | Purpose |
|---|---|
| `/` | Photo upload, zone drawing, Generate Smart Layout, save results to garden |
| `/plantings` | All plantings, filterable by status and zone |
| `/plantings/[id]` | Plant detail: care advice, journal, photo strip, past conversation summaries |
| `/journal` | Timeline of all care events; create form with tags and harvest logging |
| `/photos` | Photo grid; upload with zone/caption metadata |
| `/photos/[id]` | SVG annotation tool: draw boxes/points, label and link to plantings |
| `/photos/compare` | Side-by-side before/after with date diff |
| `/conversations` | Approved Claude conversation summaries |
| `/settings` | Edit garden name and ZIP code |

Chat is available on every page via the **Chat** button (top-right). End a chat to get an AI-written summary you can edit and save — saved summaries feed into future chats as context.

## Suggested Next Steps (Phase 3)

- User authentication (the schema already has a nullable `userId` on `Garden`)
- Real geocoding via USDA API (current ZIP heuristic is approximate)
- S3 photo storage (`lib/storage.ts` adapter is ready to swap)
- Polygon zone drawing (schema discriminated union already supports it)
- Succession planting and crop rotation view
- Community layout sharing

