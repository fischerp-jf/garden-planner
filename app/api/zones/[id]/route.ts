import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notFound, parseJson, requireZone } from "@/lib/api";
import { ZonePatch } from "@/lib/schemas";
import { serializeZone } from "@/lib/zoneSerde";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const existing = await requireZone(id);
  if (!existing) return notFound();
  const parsed = await parseJson(req, ZonePatch);
  if (parsed instanceof NextResponse) return parsed;

  const data: Record<string, unknown> = {};
  if (parsed.name !== undefined) data.name = parsed.name;
  if (parsed.orientation !== undefined) data.orientation = parsed.orientation;
  if (parsed.shape !== undefined) data.shape = JSON.stringify(parsed.shape);
  if (parsed.referencePhotoId !== undefined) data.referencePhotoId = parsed.referencePhotoId;

  const zone = await db.zone.update({ where: { id }, data });
  return NextResponse.json({ zone: serializeZone(zone) });
}

export async function DELETE(_req: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const existing = await requireZone(id);
  if (!existing) return notFound();
  await db.zone.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
