import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notFound, parseJson, requirePlanting } from "@/lib/api";
import { PlantingPatch } from "@/lib/schemas";
import { PLANTS } from "@/lib/plants";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const planting = await db.planting.findUnique({
    where: { id },
    include: {
      zone: true,
      annotations: { include: { photo: true } },
      journalEntries: { orderBy: { entryDate: "desc" }, include: { tags: true } },
      conversations: {
        include: {
          conversation: {
            select: {
              id: true,
              title: true,
              summary: true,
              startedAt: true,
              status: true,
            },
          },
        },
      },
    },
  });
  if (!planting) return notFound();

  const catalog = PLANTS.find((p) => p.id === planting.catalogId) ?? null;
  // Flatten conversation junction rows for consumer simplicity.
  const conversations = planting.conversations.map((c) => c.conversation);
  const photos = Array.from(
    new Map(planting.annotations.map((a) => [a.photo.id, a.photo])).values(),
  );

  return NextResponse.json({
    planting: { ...planting, conversations: undefined, annotations: undefined },
    catalog,
    photos,
    annotations: planting.annotations.map((a) => ({ ...a, photo: undefined })),
    journalEntries: planting.journalEntries,
    conversations,
  });
}

export async function PATCH(req: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const existing = await requirePlanting(id);
  if (!existing) return notFound();
  const parsed = await parseJson(req, PlantingPatch);
  if (parsed instanceof NextResponse) return parsed;
  const planting = await db.planting.update({ where: { id }, data: parsed });
  return NextResponse.json({ planting });
}

export async function DELETE(_req: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const existing = await requirePlanting(id);
  if (!existing) return notFound();
  await db.planting.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
