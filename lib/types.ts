export type Orientation = "N" | "S" | "E" | "W";

export type SunExposure = "full_sun" | "part_sun" | "shade";

export type PlantCategory =
  | "vegetable"
  | "flower"
  | "herb"
  | "perennial"
  | "annual"
  | "fruit"
  | "nitrogen_fixer"
  | "pollinator_support";

export type Season = "spring" | "summer" | "fall" | "winter";

export interface Plant {
  id: string;
  name: string;
  latinName: string;
  categories: PlantCategory[];
  zoneMin: number;
  zoneMax: number;
  sunNeeds: SunExposure[];
  matureSpreadIn: number;
  companionIds: string[];
  antagonisticIds: string[];
  sowMonths: number[];
  transplantMonths: number[];
  harvestMonths: number[];
  notes: string;
  care: {
    watering: string;
    feeding: string;
    pruning: string;
  };
}

export interface ZoneRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RecommendationRequest {
  zipCode: string;
  orientation: Orientation;
  month: number;
  categories: PlantCategory[];
  zones: ZoneRect[];
}

export interface PlantRecommendation {
  plant: Plant;
  score: number;
  sunExposure: SunExposure;
  reasons: string[];
  companions: string[];
  warnings: string[];
  recommendedZoneIds: string[];
}

export interface PlantPlacement {
  zoneId: string;
  plantId: string;
  x: number;
  y: number;
  matureSpreadIn: number;
  season: Season;
  color: string;
}

export interface CalendarEntry {
  plantId: string;
  plantName: string;
  task: "seed" | "transplant" | "harvest";
  month: number;
  notes: string;
}

export interface RecommendationResponse {
  usdaZone: number;
  frostDates: {
    lastSpring: string;
    firstFall: string;
  };
  zonesSun: Record<string, SunExposure>;
  recommendations: PlantRecommendation[];
  placements: PlantPlacement[];
  calendar: CalendarEntry[];
}
