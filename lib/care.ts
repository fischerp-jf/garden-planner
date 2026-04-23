import { estimateFrostDates, inferUsdaZone, monthName, seasonFromMonth } from "@/lib/climate";
import { PLANTS } from "@/lib/plants";
import type { Plant, Season } from "@/lib/types";

// Per-planting advice. Pure function so it's trivially testable and can be
// swapped for a model-generated version later without touching route code.

export interface CareAdviceInput {
  catalogId: string;
  zipCode: string;
  today?: Date;
  status?: string; // optional, lets us tailor copy for "planned" vs "growing"
}

export interface CareAdvice {
  catalog: Plant;
  month: number;
  monthName: string;
  season: Season;
  usdaZone: number;
  frostDates: { lastSpring: string; firstFall: string };
  watering: string;
  feeding: string;
  pruning: string;
  harvestWindow: { from: string | null; to: string | null };
  expectedIssuesThisMonth: string[];
  companionSuggestions: { id: string; name: string }[];
}

function catalogLookup(id: string): Plant | undefined {
  return PLANTS.find((p) => p.id === id);
}

function monthsToRange(months: number[]): { from: string | null; to: string | null } {
  if (months.length === 0) return { from: null, to: null };
  const sorted = [...months].sort((a, b) => a - b);
  return { from: monthName(sorted[0]), to: monthName(sorted[sorted.length - 1]) };
}

function deriveIssues(plant: Plant, month: number, season: Season): string[] {
  const issues: string[] = [];
  if (season === "summer" && plant.categories.includes("vegetable")) {
    issues.push("Watch for heat stress — mulch and water early morning.");
  }
  if (plant.categories.includes("vegetable") && [6, 7, 8].includes(month)) {
    issues.push("Aphid and caterpillar pressure peaks this month.");
  }
  if (season === "spring" && plant.transplantMonths.includes(month)) {
    issues.push("Hardening off transplants avoids transplant shock.");
  }
  if (season === "fall" && plant.harvestMonths.includes(month)) {
    issues.push("Harvest before first frost to preserve quality.");
  }
  if (season === "winter" && plant.categories.includes("perennial")) {
    issues.push("Mulch crown heavily to protect against freeze damage.");
  }
  return issues;
}

export function buildCareAdvice(input: CareAdviceInput): CareAdvice | null {
  const plant = catalogLookup(input.catalogId);
  if (!plant) return null;

  const today = input.today ?? new Date();
  const month = today.getMonth() + 1;
  const season = seasonFromMonth(month);
  const usdaZone = inferUsdaZone(input.zipCode);
  const frostDates = estimateFrostDates(usdaZone);

  const companions = plant.companionIds
    .map((id) => catalogLookup(id))
    .filter((p): p is Plant => Boolean(p))
    .map((p) => ({ id: p.id, name: p.name }));

  return {
    catalog: plant,
    month,
    monthName: monthName(month),
    season,
    usdaZone,
    frostDates,
    watering: plant.care.watering,
    feeding: plant.care.feeding,
    pruning: plant.care.pruning,
    harvestWindow: monthsToRange(plant.harvestMonths),
    expectedIssuesThisMonth: deriveIssues(plant, month, season),
    companionSuggestions: companions,
  };
}
