import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notFound, parseJson, requireGarden } from "@/lib/api";
import { ZoneCreate } from "@/lib/schemas";
import { serializeZone } from "@/lib/zoneSerde";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params): Promise<NextResponse> {
  const { id: gardenId } = await params;
  const garden = await requireGarden(gardenId);
  if (!garden) return notFound("Garden not found");

  const parsed = await parseJson(req, ZoneCreate);
  if (parsed instanceof NextResponse) return parsed;

  const zone = await db.zone.create({
    data: {
      gardenId,
      name: parsed.name,
      orientation: parsed.orientation,
      shape: JSON.stringify(parsed.shape),
      referencePhotoId: parsed.referencePhotoId,
    },
  });
  return NextResponse.json({ zone: serializeZone(zone) }, { status: 201 });
}
