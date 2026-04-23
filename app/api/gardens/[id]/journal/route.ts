import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notFound, parseJson, parseQuery, requireGarden } from "@/lib/api";
import { JournalCreate, JournalListQuery } from "@/lib/schemas";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params): Promise<NextResponse> {
  const { id: gardenId } = await params;
  const garden = await requireGarden(gardenId);
  if (!garden) return notFound("Garden not found");
  const query = parseQuery(req.url, JournalListQuery);
  if (query instanceof NextResponse) return query;

  const where: Record<string, unknown> = { gardenId };
  if (query.plantingId) where.plantingId = query.plantingId;
  if (query.zoneId) where.zoneId = query.zoneId;
  if (query.from || query.to) {
    const range: Record<string, Date> = {};
    if (query.from) range.gte = query.from;
    if (query.to) range.lte = query.to;
    where.entryDate = range;
  }
  if (query.tag) where.tags = { some: { tag: query.tag } };

  const entries = await db.journalEntry.findMany({
    where,
    orderBy: { entryDate: "desc" },
    include: { tags: true },
  });
  return NextResponse.json({ entries });
}

export async function POST(req: Request, { params }: Params): Promise<NextResponse> {
  const { id: gardenId } = await params;
  const garden = await requireGarden(gardenId);
  if (!garden) return notFound("Garden not found");

  const parsed = await parseJson(req, JournalCreate);
  if (parsed instanceof NextResponse) return parsed;

  const { tags, ...rest } = parsed;
  const entry = await db.journalEntry.create({
    data: {
      gardenId,
      ...rest,
      tags: tags.length ? { create: tags.map((tag) => ({ tag })) } : undefined,
    },
    include: { tags: true },
  });
  return NextResponse.json({ entry }, { status: 201 });
}
