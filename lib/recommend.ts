import { estimateFrostDates, inferUsdaZone, seasonFromMonth } from "@/lib/climate";
import { PLANTS } from "@/lib/plants";
import {
  CalendarEntry,
  Orientation,
  Plant,
  PlantPlacement,
  PlantRecommendation,
  RecommendationRequest,
  RecommendationResponse,
  SunExposure,
  ZoneRect
} from "@/lib/types";

const SEASON_COLORS: Record<string, string> = {
  spring: "#79b66d",
  summer: "#f2b449",
  fall: "#cf8440",
  winter: "#77a3c7"
};

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value));
}

function monthDistance(a: number, b: number): number {
  const raw = Math.abs(a - b);
  return Math.min(raw, 12 - raw);
}

function hasMonthNearby(current: number, list: number[]): boolean {
  return list.some((month) => monthDistance(current, month) <= 1);
}

function categorizeSun(score: number): SunExposure {
  if (score >= 0.66) {
    return "full_sun";
  }

  if (score >= 0.38) {
    return "part_sun";
  }

  return "shade";
}

function seasonalSunAdjustment(month: number): number {
  if ([6, 7, 8].includes(month)) {
    return 0.12;
  }

  if ([11, 12, 1, 2].includes(month)) {
    return -0.18;
  }

  return 0;
}

export function sunExposureForZone(zone: ZoneRect, orientation: Orientation, month: number): SunExposure {
  const cx = zone.x + zone.width / 2;
  const cy = zone.y + zone.height / 2;

  // Treat image orientation as where north is on-screen; infer southern warmth bias.
  const southFacingBias =
    orientation === "N"
      ? cy
      : orientation === "S"
        ? 1 - cy
        : orientation === "E"
          ? 1 - cx
          : cx;

  const edgeShadePenalty = clamp((0.12 - zone.x) + (0.12 - zone.y), -0.08, 0.08);
  const rawScore = clamp(southFacingBias + seasonalSunAdjustment(month) - edgeShadePenalty, 0, 1);

  return categorizeSun(rawScore);
}

function sunMatchScore(plant: Plant, zoneSun: SunExposure): number {
  if (plant.sunNeeds.includes(zoneSun)) {
    return 1;
  }

  if (zoneSun === "part_sun" && plant.sunNeeds.includes("full_sun")) {
    return 0.68;
  }

  if (zoneSun === "full_sun" && plant.sunNeeds.includes("part_sun")) {
    return 0.72;
  }

  if (zoneSun === "shade" && plant.sunNeeds.includes("part_sun")) {
    return 0.55;
  }

  return 0.25;
}

function climateScore(plant: Plant, zone: number): number {
  if (zone >= plant.zoneMin && zone <= plant.zoneMax) {
    return 1;
  }

  const distance = Math.min(Math.abs(zone - plant.zoneMin), Math.abs(zone - plant.zoneMax));
  return distance === 1 ? 0.65 : 0.35;
}

function seasonScore(plant: Plant, month: number): number {
  const activeMonths = [...plant.sowMonths, ...plant.transplantMonths];
  if (activeMonths.includes(month)) {
    return 1;
  }

  if (hasMonthNearby(month, activeMonths)) {
    return 0.75;
  }

  if (plant.harvestMonths.includes(month)) {
    return 0.7;
  }

  return 0.42;
}

function isEdible(plant: Plant): boolean {
  return plant.categories.includes("vegetable") || plant.categories.includes("herb") || plant.categories.includes("fruit");
}

function permacultureBonus(plant: Plant): number {
  let score = 0;

  if (plant.categories.includes("perennial")) {
    score += 0.18;
  }

  if (plant.categories.includes("nitrogen_fixer")) {
    score += 0.15;
  }

  if (plant.categories.includes("pollinator_support")) {
    score += 0.12;
  }

  if (isEdible(plant)) {
    score += 0.12;
  }

  return score;
}

function pairConflict(candidate: Plant, selected: Plant[]): boolean {
  return selected.some(
    (existing) => candidate.antagonisticIds.includes(existing.id) || existing.antagonisticIds.includes(candidate.id)
  );
}

function recommendationReasons(plant: Plant, sun: SunExposure, zone: number, month: number): string[] {
  const reasons: string[] = [];

  if (plant.sunNeeds.includes(sun)) {
    reasons.push(`Sun fit: ${sun.replace("_", " ")}`);
  } else {
    reasons.push(`Sun adaptation: handles ${sun.replace("_", " ")} with support`);
  }

  if (zone >= plant.zoneMin && zone <= plant.zoneMax) {
    reasons.push(`Climate fit: USDA zone ${zone}`);
  } else {
    reasons.push(`Near-climate fit: works close to zone ${zone}`);
  }

  if (plant.sowMonths.includes(month) || plant.transplantMonths.includes(month)) {
    reasons.push("Seasonal timing is active right now");
  } else if (plant.harvestMonths.includes(month)) {
    reasons.push("This month aligns with likely harvest");
  } else {
    reasons.push("Can be staged as part of succession planning");
  }

  if (plant.categories.includes("perennial") || plant.categories.includes("nitrogen_fixer")) {
    reasons.push("Supports long-term regenerative bed health");
  }

  return reasons;
}

function firstMonthOrFallback(months: number[], fallback: number): number {
  return months.length > 0 ? months[0] : fallback;
}

function buildCalendar(plant: Plant, currentMonth: number): CalendarEntry[] {
  const nextSeed = firstMonthOrFallback(plant.sowMonths, currentMonth);
  const nextTransplant = firstMonthOrFallback(plant.transplantMonths, currentMonth);
  const nextHarvest = firstMonthOrFallback(plant.harvestMonths, currentMonth);

  const entries: CalendarEntry[] = [
    {
      plantId: plant.id,
      plantName: plant.name,
      task: "seed",
      month: nextSeed,
      notes: `${plant.notes} ${plant.care.watering}`
    }
  ];

  if (plant.transplantMonths.length > 0) {
    entries.push({
      plantId: plant.id,
      plantName: plant.name,
      task: "transplant",
      month: nextTransplant,
      notes: `${plant.care.feeding} ${plant.care.pruning}`
    });
  }

  if (plant.harvestMonths.length > 0) {
    entries.push({
      plantId: plant.id,
      plantName: plant.name,
      task: "harvest",
      month: nextHarvest,
      notes: "Harvest window based on current cultivar timing."
    });
  }

  return entries;
}

export function computeRecommendations(input: RecommendationRequest): RecommendationResponse {
  const usdaZone = inferUsdaZone(input.zipCode);
  const frostDates = estimateFrostDates(usdaZone);
  const categories = input.categories.length ? input.categories : ["vegetable", "herb", "flower", "annual", "perennial"];
  const categorySet = new Set(categories);

  const zonesSun: Record<string, SunExposure> = {};
  for (const zone of input.zones) {
    zonesSun[zone.id] = sunExposureForZone(zone, input.orientation, input.month);
  }

  const scored: Array<{ zoneId: string; plant: Plant; score: number; sun: SunExposure }> = [];

  for (const zone of input.zones) {
    const sun = zonesSun[zone.id];

    for (const plant of PLANTS) {
      if (!plant.categories.some((cat) => categorySet.has(cat))) {
        continue;
      }

      const sunScore = sunMatchScore(plant, sun);
      if (sunScore < 0.5) {
        continue;
      }

      const score =
        sunScore * 0.38 +
        climateScore(plant, usdaZone) * 0.3 +
        seasonScore(plant, input.month) * 0.22 +
        permacultureBonus(plant) * 0.1;

      scored.push({ zoneId: zone.id, plant, score, sun });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const selectedPlacements = new Map<string, { zone: ZoneRect; plant: Plant; sun: SunExposure; score: number }>();
  const selectedPlants: Plant[] = [];

  for (const zone of input.zones) {
    const candidates = scored.filter((item) => item.zoneId === zone.id);
    if (candidates.length === 0) {
      continue;
    }

    const picked = candidates.find((candidate) => !pairConflict(candidate.plant, selectedPlants)) ?? candidates[0];
    selectedPlacements.set(zone.id, { zone, plant: picked.plant, sun: picked.sun, score: picked.score });
    selectedPlants.push(picked.plant);
  }

  for (const item of scored) {
    if (selectedPlants.length >= 10) {
      break;
    }

    if (selectedPlants.some((plant) => plant.id === item.plant.id)) {
      continue;
    }

    if (pairConflict(item.plant, selectedPlants)) {
      continue;
    }

    selectedPlants.push(item.plant);
  }

  const selectedPlantIds = new Set(selectedPlants.map((plant) => plant.id));
  const plantById = new Map(PLANTS.map((plant) => [plant.id, plant]));

  const placements: PlantPlacement[] = [];
  for (const [, value] of selectedPlacements) {
    placements.push({
      zoneId: value.zone.id,
      plantId: value.plant.id,
      x: value.zone.x + value.zone.width / 2,
      y: value.zone.y + value.zone.height / 2,
      matureSpreadIn: value.plant.matureSpreadIn,
      season: seasonFromMonth(input.month),
      color: SEASON_COLORS[seasonFromMonth(input.month)]
    });
  }

  const recommendations: PlantRecommendation[] = selectedPlants.slice(0, 10).map((plant) => {
    const placementForPlant = [...selectedPlacements.values()].find((entry) => entry.plant.id === plant.id);
    const plantSun = placementForPlant?.sun ?? "part_sun";

    const companions = plant.companionIds
      .filter((id) => selectedPlantIds.has(id))
      .map((id) => plantById.get(id)?.name)
      .filter((name): name is string => Boolean(name));

    const warnings = plant.antagonisticIds
      .filter((id) => selectedPlantIds.has(id))
      .map((id) => `Avoid near ${plantById.get(id)?.name ?? id}`);

    return {
      plant,
      score: placementForPlant?.score ?? 0,
      sunExposure: plantSun,
      reasons: recommendationReasons(plant, plantSun, usdaZone, input.month),
      companions,
      warnings,
      recommendedZoneIds: [...selectedPlacements.entries()]
        .filter(([, entry]) => entry.plant.id === plant.id)
        .map(([zoneId]) => zoneId)
    };
  });

  const calendar = recommendations
    .flatMap((recommendation) => buildCalendar(recommendation.plant, input.month))
    .sort((a, b) => a.month - b.month);

  return {
    usdaZone,
    frostDates,
    zonesSun,
    recommendations,
    placements,
    calendar
  };
}
