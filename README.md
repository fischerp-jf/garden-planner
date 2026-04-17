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
- `/app/api/recommend/route.ts`: recommendation endpoint
- `/lib/plants.ts`: plant catalog and companion/antagonist metadata
- `/lib/climate.ts`: ZIP-based USDA zone approximation + frost dates
- `/lib/recommend.ts`: scoring and placement logic
- `/lib/types.ts`: shared types

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

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

## Suggested Next Steps (Phase 2)

- Persist projects and user accounts
- Real geocoding + map-backed climate data
- Succession planting and crop rotation (multi-year)
- Pest/disease risk detection by plant mix + season
- Weather-driven watering recommendations
- Community layout sharing and private templates

