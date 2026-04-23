import { z } from "zod";
import { CATALOG_IDS } from "@/lib/plants";

// Shared primitives -----------------------------------------------------------

const normalizedCoord = z.number().min(0).max(1);

const Orientation = z.enum(["N", "S", "E", "W"]);

const PlantingStatus = z.enum([
  "planned",
  "planted",
  "growing",
  "harvested",
  "removed",
  "died",
]);

const AnnotationKind = z.enum(["box", "point"]);

const AnnotationSource = z.enum(["manual", "ai_suggested", "ai_confirmed"]);

const JournalTag = z.enum([
  "watered",
  "fertilized",
  "pruned",
  "harvested",
  "pest_observed",
  "disease_observed",
  "weather_event",
]);

export type JournalTagValue = z.infer<typeof JournalTag>;

// Zone.shape is persisted as a JSON string. A discriminated union keeps the
// door open for polygons without touching the column type.
export const ZoneShape = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("rect"),
    x: normalizedCoord,
    y: normalizedCoord,
    width: normalizedCoord,
    height: normalizedCoord,
  }),
  z.object({
    kind: z.literal("polygon"),
    points: z
      .array(z.object({ x: normalizedCoord, y: normalizedCoord }))
      .min(3),
  }),
]);
export type ZoneShapeValue = z.infer<typeof ZoneShape>;

// ISO date or Date — the client typically sends strings, the server coerces.
const dateLike = z.preprocess((v) => {
  if (v instanceof Date) return v;
  if (typeof v === "string" && v.length > 0) return new Date(v);
  return v;
}, z.date());

// Gardens ---------------------------------------------------------------------

export const GardenCreate = z.object({
  name: z.string().min(1).max(200),
  zipCode: z.string().min(3).max(10),
});

export const GardenPatch = GardenCreate.partial();

// Zones -----------------------------------------------------------------------

export const ZoneCreate = z.object({
  name: z.string().max(200).optional(),
  orientation: Orientation,
  shape: ZoneShape,
  referencePhotoId: z.string().cuid().optional(),
});

export const ZonePatch = ZoneCreate.partial();

// Plantings -------------------------------------------------------------------

export const PlantingCreate = z.object({
  catalogId: z.enum(CATALOG_IDS),
  zoneId: z.string().cuid().optional(),
  nickname: z.string().max(200).optional(),
  status: PlantingStatus,
  plantedAt: dateLike.optional(),
  positionX: normalizedCoord.optional(),
  positionY: normalizedCoord.optional(),
  notes: z.string().max(4000).optional(),
});

export const PlantingPatch = z
  .object({
    catalogId: z.enum(CATALOG_IDS),
    zoneId: z.string().cuid().nullable(),
    nickname: z.string().max(200).nullable(),
    status: PlantingStatus,
    plantedAt: dateLike.nullable(),
    removedAt: dateLike.nullable(),
    positionX: normalizedCoord.nullable(),
    positionY: normalizedCoord.nullable(),
    notes: z.string().max(4000).nullable(),
  })
  .partial();

// Photos ----------------------------------------------------------------------

// Metadata portion of a multipart upload. The binary file is parsed separately
// by the route handler from FormData.
export const PhotoUploadMetadata = z.object({
  zoneId: z.string().cuid().optional(),
  caption: z.string().max(500).optional(),
  takenAt: dateLike.optional(),
});

export const PhotoPatch = z
  .object({
    zoneId: z.string().cuid().nullable(),
    caption: z.string().max(500).nullable(),
    takenAt: dateLike,
  })
  .partial();

// Annotations -----------------------------------------------------------------

export const AnnotationCreate = z
  .object({
    kind: AnnotationKind,
    x: normalizedCoord,
    y: normalizedCoord,
    width: normalizedCoord.optional(),
    height: normalizedCoord.optional(),
    plantingId: z.string().cuid().optional(),
    label: z.string().max(200).optional(),
    source: AnnotationSource.optional(),
    confidence: z.number().min(0).max(1).optional(),
    modelVersion: z.string().max(100).optional(),
  })
  .refine(
    (a) => a.kind !== "box" || (a.width != null && a.height != null),
    { message: "box annotations require width and height" },
  );

export const AnnotationPatch = z
  .object({
    plantingId: z.string().cuid().nullable(),
    label: z.string().max(200).nullable(),
    x: normalizedCoord,
    y: normalizedCoord,
    width: normalizedCoord.nullable(),
    height: normalizedCoord.nullable(),
    source: AnnotationSource,
    confidence: z.number().min(0).max(1).nullable(),
    modelVersion: z.string().max(100).nullable(),
  })
  .partial();

// Journal ---------------------------------------------------------------------

export const JournalCreate = z.object({
  entryDate: dateLike,
  note: z.string().min(1).max(4000),
  plantingId: z.string().cuid().optional(),
  zoneId: z.string().cuid().optional(),
  photoId: z.string().cuid().optional(),
  tags: z.array(JournalTag).default([]),
  harvestQuantity: z.number().positive().optional(),
  harvestUnit: z.string().max(20).optional(),
});

export const JournalPatch = JournalCreate.partial();

export const JournalListQuery = z.object({
  plantingId: z.string().cuid().optional(),
  zoneId: z.string().cuid().optional(),
  tag: JournalTag.optional(),
  from: dateLike.optional(),
  to: dateLike.optional(),
});

// Chat + conversations --------------------------------------------------------

const ChatFocus = z.object({
  type: z.enum(["planting", "zone"]),
  id: z.string().cuid(),
});

const ChatMessage = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

export const ChatRequest = z.object({
  gardenId: z.string().cuid(),
  focus: ChatFocus.optional(),
  messages: z.array(ChatMessage).min(1),
});

export const ChatSummarizeRequest = z.object({
  gardenId: z.string().cuid(),
  focus: ChatFocus.optional(),
  transcript: z.array(ChatMessage).min(2),
});

export const ConversationCreate = z.object({
  gardenId: z.string().cuid(),
  title: z.string().max(200).optional(),
  summary: z.string().min(1),
  startedAt: dateLike,
  endedAt: dateLike.optional(),
  plantingIds: z.array(z.string().cuid()).default([]),
  zoneIds: z.array(z.string().cuid()).default([]),
});

export const ConversationPatch = z
  .object({
    title: z.string().max(200).nullable(),
    summary: z.string().min(1),
    status: z.enum(["pending_summary", "approved"]),
  })
  .partial();

// Convenience type re-exports -------------------------------------------------

export type GardenCreateInput = z.infer<typeof GardenCreate>;
export type ZoneCreateInput = z.infer<typeof ZoneCreate>;
export type PlantingCreateInput = z.infer<typeof PlantingCreate>;
export type AnnotationCreateInput = z.infer<typeof AnnotationCreate>;
export type JournalCreateInput = z.infer<typeof JournalCreate>;
export type ChatRequestInput = z.infer<typeof ChatRequest>;
export type ConversationCreateInput = z.infer<typeof ConversationCreate>;
