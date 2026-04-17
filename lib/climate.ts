import { Season } from "@/lib/types";

const FIRST_TWO_DIGIT_ZONE_BANDS: Array<{ min: number; max: number; zone: number }> = [
  { min: 0, max: 9, zone: 5 },
  { min: 10, max: 19, zone: 6 },
  { min: 20, max: 29, zone: 6 },
  { min: 30, max: 39, zone: 7 },
  { min: 40, max: 49, zone: 7 },
  { min: 50, max: 59, zone: 8 },
  { min: 60, max: 69, zone: 8 },
  { min: 70, max: 79, zone: 8 },
  { min: 80, max: 89, zone: 9 },
  { min: 90, max: 94, zone: 9 },
  { min: 95, max: 99, zone: 10 }
];

const FROST_BY_ZONE: Record<number, { lastSpring: string; firstFall: string }> = {
  3: { lastSpring: "May 25", firstFall: "September 20" },
  4: { lastSpring: "May 15", firstFall: "September 30" },
  5: { lastSpring: "May 5", firstFall: "October 10" },
  6: { lastSpring: "April 25", firstFall: "October 20" },
  7: { lastSpring: "April 15", firstFall: "October 30" },
  8: { lastSpring: "March 28", firstFall: "November 12" },
  9: { lastSpring: "March 5", firstFall: "November 28" },
  10: { lastSpring: "February 15", firstFall: "December 15" }
};

export function inferUsdaZone(zipCode: string): number {
  const digits = zipCode.replace(/\D/g, "").slice(0, 2);
  if (digits.length < 2) {
    return 7;
  }

  const prefix = Number.parseInt(digits, 10);
  const match = FIRST_TWO_DIGIT_ZONE_BANDS.find((band) => prefix >= band.min && prefix <= band.max);
  return match?.zone ?? 7;
}

export function estimateFrostDates(zone: number): { lastSpring: string; firstFall: string } {
  return FROST_BY_ZONE[zone] ?? FROST_BY_ZONE[7];
}

export function seasonFromMonth(month: number): Season {
  if ([3, 4, 5].includes(month)) {
    return "spring";
  }

  if ([6, 7, 8].includes(month)) {
    return "summer";
  }

  if ([9, 10, 11].includes(month)) {
    return "fall";
  }

  return "winter";
}

export function monthName(month: number): string {
  const names = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  const index = Math.max(1, Math.min(12, month)) - 1;
  return names[index];
}
