import type { Zone } from "@/generated/prisma/client";
import type { ZoneShapeValue } from "@/lib/schemas";

// Zone.shape is stored as a JSON string (SQLite has no native Json). Route
// handlers parse it on read so clients always see structured shapes, and
// stringify on write via the schema-validated value.

export type SerializedZone = Omit<Zone, "shape"> & { shape: ZoneShapeValue };

export function serializeZone(zone: Zone): SerializedZone {
  let shape: ZoneShapeValue;
  try {
    shape = JSON.parse(zone.shape) as ZoneShapeValue;
  } catch {
    // Defensive: if persisted shape is corrupt, surface a benign empty rect
    // rather than 500ing the whole request. This should never happen since
    // writes go through zod, but tolerate drift.
    shape = { kind: "rect", x: 0, y: 0, width: 0, height: 0 };
  }
  return { ...zone, shape };
}
