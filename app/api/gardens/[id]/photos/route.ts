import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { badRequest, notFound, requireGarden } from "@/lib/api";
import { PhotoUploadMetadata } from "@/lib/schemas";
import { buildStorageKey, saveFile } from "@/lib/storage";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// Multipart: a binary `file` plus a JSON `metadata` string field. We parse the
// metadata through zod so optional zoneId/caption/takenAt share the same
// validation surface as JSON routes.

export async function POST(req: Request, { params }: Params): Promise<NextResponse> {
  const { id: gardenId } = await params;
  const garden = await requireGarden(gardenId);
  if (!garden) return notFound("Garden not found");

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return badRequest("Expected multipart/form-data");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return badRequest("Missing file field");

  const metaRaw = formData.get("metadata");
  let metaParsed: unknown = {};
  if (typeof metaRaw === "string" && metaRaw.length > 0) {
    try {
      metaParsed = JSON.parse(metaRaw);
    } catch {
      return badRequest("metadata must be valid JSON");
    }
  }
  const meta = PhotoUploadMetadata.safeParse(metaParsed);
  if (!meta.success) return badRequest("Invalid metadata", meta.error.issues);

  const photoId = randomUUID();
  const ext = file.name.split(".").pop() ?? file.type.split("/").pop() ?? "bin";
  const key = buildStorageKey(gardenId, photoId, ext);

  const bytes = Buffer.from(await file.arrayBuffer());
  await saveFile(key, bytes);

  const takenAt = meta.data.takenAt ?? new Date();

  const photo = await db.photo.create({
    data: {
      id: photoId,
      gardenId,
      zoneId: meta.data.zoneId,
      url: key,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      takenAt,
      caption: meta.data.caption,
    },
  });

  return NextResponse.json({ photo }, { status: 201 });
}
