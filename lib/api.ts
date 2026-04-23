import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { db } from "@/lib/db";

// Thin helpers shared by every /app/api route. Keeping these centralized so
// error shapes stay consistent and zod errors always render the same way
// across the CRUD surface.

export type ApiError = { error: string; details?: unknown };

export function badRequest(message: string, details?: unknown): NextResponse<ApiError> {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function notFound(message = "Not found"): NextResponse<ApiError> {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = "Internal error", details?: unknown): NextResponse<ApiError> {
  return NextResponse.json({ error: message, details }, { status: 500 });
}

// Parse + validate JSON body with a zod schema. Returns either the parsed
// value or a 400 response. Caller pattern: `if (parsed instanceof NextResponse) return parsed;`
export async function parseJson<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<T | NextResponse<ApiError>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return badRequest("Validation failed", formatZodError(result.error));
  }
  return result.data;
}

export function parseQuery<T>(
  url: string,
  schema: ZodType<T>,
): T | NextResponse<ApiError> {
  const searchParams = new URL(url).searchParams;
  const obj: Record<string, string> = {};
  for (const [k, v] of searchParams) obj[k] = v;
  const result = schema.safeParse(obj);
  if (!result.success) {
    return badRequest("Invalid query", formatZodError(result.error));
  }
  return result.data;
}

function formatZodError(err: ZodError): unknown {
  return err.issues.map((i) => ({ path: i.path, message: i.message }));
}

// Fetch-and-verify helpers. Phase 2 has no auth, so these just confirm the
// row exists. When auth lands, a userId check drops in here in one place.

export async function requireGarden(gardenId: string) {
  return db.garden.findUnique({ where: { id: gardenId } });
}

export async function requireZone(zoneId: string) {
  return db.zone.findUnique({ where: { id: zoneId } });
}

export async function requirePlanting(plantingId: string) {
  return db.planting.findUnique({ where: { id: plantingId } });
}

export async function requirePhoto(photoId: string) {
  return db.photo.findUnique({ where: { id: photoId } });
}

export async function requireAnnotation(annotationId: string) {
  return db.photoAnnotation.findUnique({ where: { id: annotationId } });
}

export async function requireJournalEntry(entryId: string) {
  return db.journalEntry.findUnique({ where: { id: entryId } });
}

export async function requireConversation(conversationId: string) {
  return db.conversation.findUnique({ where: { id: conversationId } });
}
