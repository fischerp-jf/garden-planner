import { Divider, Grid, H1, H2, Link, Stack, Stat, Table, Text } from "cursor/canvas";

const layerRows = [
  [
    "Presentation",
    "`app/page.tsx`",
    "Collects garden photo, zones, orientation, ZIP, month, and categories; renders overlays, recommendations, and calendar."
  ],
  [
    "API Boundary",
    "`app/api/recommend/route.ts`",
    "Validates request shape, enforces orientation/month/zone constraints, and delegates scoring to the recommendation engine."
  ],
  [
    "Domain Engine",
    "`lib/recommend.ts`",
    "Computes zone sunlight, plant scores, conflict-aware selection, placements, and planting calendar."
  ],
  [
    "Climate Utilities",
    "`lib/climate.ts`",
    "Infers USDA zone from ZIP prefix, returns frost dates, and maps months to seasons."
  ],
  [
    "Shared Contracts",
    "`lib/types.ts`",
    "Defines request/response schemas and shared domain types used by UI + API + engine."
  ]
];

const flowRows = [
  ["1", "User in UI", "Uploads image and draws one or more planting rectangles (zones)."],
  ["2", "UI state", "Adds climate context (orientation, ZIP, month) and category priorities."],
  ["3", "POST /api/recommend", "Sends `RecommendationRequest` JSON from browser to app route."],
  ["4", "Route validation", "Rejects malformed inputs early with actionable 400 errors."],
  ["5", "computeRecommendations()", "Infers climate + sun exposure, scores plants, picks top compatible set, builds placements/calendar."],
  ["6", "UI render", "Displays climate snapshot, top recommendations, draggable placements, and calendar tasks."]
];

const contractRows = [
  ["`RecommendationRequest`", "zipCode, orientation, month, categories, zones", "Input contract for deterministic plan generation."],
  ["`PlantRecommendation`", "plant, score, reasons, companions, warnings, recommendedZoneIds", "Explains why a plant was selected and caveats."],
  ["`PlantPlacement`", "zoneId, plantId, x, y, matureSpreadIn, season, color", "Drives on-image overlay circles and drag behavior."],
  ["`RecommendationResponse`", "usdaZone, frostDates, zonesSun, recommendations, placements, calendar", "Single response payload consumed by frontend result panels."]
];

const extensionRows = [
  ["Climate precision", "Replace ZIP-prefix heuristic with geocoding + USDA/NOAA datasets for location-level fidelity."],
  ["Persistence", "Store projects/users so plans and layouts survive reloads and become sharable."],
  ["Long-horizon planning", "Add succession + rotation logic spanning multiple seasons/years."],
  ["Risk intelligence", "Layer pest/disease risk and weather-adjusted irrigation suggestions into scoring."]
];

export default function ProjectArchitectureOverviewCanvas() {
  return (
    <Stack gap={20}>
      <H1>Project Architecture Overview</H1>
      <Text>
        This MVP is a single Next.js application with a clear separation between interactive planner UI, a thin API
        boundary, and a local recommendation engine. The architecture is optimized for quick iteration now while
        preserving a clean seam for backend evolution later.
      </Text>

      <Grid columns={3} gap={16}>
        <Stat value="1" label="Primary UI Route" />
        <Stat value="1" label="Recommendation API Endpoint" />
        <Stat value="4" label="Core Domain Modules" />
      </Grid>

      <Divider />

      <H2>Table of Contents</H2>
      <Table
        headers={["Section", "Focus"]}
        rows={[
          ["System Layers", "Where responsibilities live"],
          ["End-to-End Request Flow", "How data moves from user action to layout"],
          ["Data Contracts", "Types that keep frontend/API/engine aligned"],
          ["Evolution Path", "Natural extension points for Phase 2"]
        ]}
      />

      <Divider />

      <H2>System Layers</H2>
      <Table headers={["Layer", "Primary File", "Responsibility"]} rows={layerRows} />

      <Divider />

      <H2>End-to-End Request Flow</H2>
      <Table headers={["Step", "Component", "What Happens"]} rows={flowRows} />

      <Divider />

      <H2>Data Contracts</H2>
      <Table headers={["Type", "Key Fields", "Purpose"]} rows={contractRows} />

      <Divider />

      <H2>Evolution Path</H2>
      <Table headers={["Opportunity", "Why It Matters"]} rows={extensionRows} />

      <Text tone="secondary" size="small">
        Source docs: <Link href="README.md">README.md</Link> and <Link href="FILE_GUIDE.md">FILE_GUIDE.md</Link>
      </Text>
    </Stack>
  );
}
