import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notFound, parseJson, requireGarden } from "@/lib/api";
import { GardenPatch } from "@/lib/schemas";
import { serializeZone } from "@/lib/zoneSerde";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const garden = await db.garden.findUnique({
    where: { id },
    include: {
      zones: { orderBy: { createdAt: "asc" } },
      plantings: { orderBy: { createdAt: "asc" } },
      photos: { orderBy: { takenAt: "desc" } },
    },
  });
  if (!garden) return notFound();

  const recentJournal = await db.journalEntry.findMany({
    where: { gardenId: id },
    orderBy: { entryDate: "desc" },
    take: 20,
    include: { tags: true },
  });

  const { zones, ...rest } = garden;
  const serialized = { ...rest, zones: zones.map(serializeZone) };
  return NextResponse.json({ garden: serialized, recentJournal });
}

export async function PATCH(req: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const existing = await requireGarden(id);
  if (!existing) return notFound();
  const parsed = await parseJson(req, GardenPatch);
  if (parsed instanceof NextResponse) return parsed;
  const garden = await db.garden.update({ where: { id }, data: parsed });
  return NextResponse.json({ garden });
}

export async function DELETE(_req: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const existing = await requireGarden(id);
  if (!existing) return notFound();
  await db.garden.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
