import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notFound, parseJson, requireGarden } from "@/lib/api";
import { PlantingCreate } from "@/lib/schemas";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params): Promise<NextResponse> {
  const { id: gardenId } = await params;
  const garden = await requireGarden(gardenId);
  if (!garden) return notFound("Garden not found");

  const parsed = await parseJson(req, PlantingCreate);
  if (parsed instanceof NextResponse) return parsed;

  const planting = await db.planting.create({
    data: { gardenId, ...parsed },
  });
  return NextResponse.json({ planting }, { status: 201 });
}
