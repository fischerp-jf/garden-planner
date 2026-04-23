import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { badRequest, notFound, parseJson, requireGarden } from "@/lib/api";
import { ConversationCreate } from "@/lib/schemas";

export const runtime = "nodejs";

// List approved/pending conversations. All filters optional; requires at
// least `gardenId` since ownership is garden-rooted.
export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const gardenId = url.searchParams.get("gardenId");
  if (!gardenId) return badRequest("gardenId is required");
  const plantingId = url.searchParams.get("plantingId");
  const zoneId = url.searchParams.get("zoneId");
  const status = url.searchParams.get("status");

  const where: Record<string, unknown> = { gardenId };
  if (status) where.status = status;
  if (plantingId) where.plantings = { some: { plantingId } };
  if (zoneId) where.zones = { some: { zoneId } };

  const conversations = await db.conversation.findMany({
    where,
    orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }],
    include: {
      plantings: { select: { plantingId: true } },
      zones: { select: { zoneId: true } },
    },
  });
  return NextResponse.json({ conversations });
}

// Persist an approved summary. Writes Conversation + junction rows inside a
// transaction so a failure leaves no orphan rows.
export async function POST(req: Request): Promise<NextResponse> {
  const parsed = await parseJson(req, ConversationCreate);
  if (parsed instanceof NextResponse) return parsed;

  const garden = await requireGarden(parsed.gardenId);
  if (!garden) return notFound("Garden not found");

  const conversation = await db.$transaction(async (tx) => {
    const created = await tx.conversation.create({
      data: {
        gardenId: parsed.gardenId,
        title: parsed.title,
        summary: parsed.summary,
        startedAt: parsed.startedAt,
        endedAt: parsed.endedAt,
        status: "approved",
        approvedAt: new Date(),
      },
    });
    if (parsed.plantingIds.length) {
      await tx.conversationPlanting.createMany({
        data: parsed.plantingIds.map((plantingId) => ({
          conversationId: created.id,
          plantingId,
        })),
      });
    }
    if (parsed.zoneIds.length) {
      await tx.conversationZone.createMany({
        data: parsed.zoneIds.map((zoneId) => ({
          conversationId: created.id,
          zoneId,
        })),
      });
    }
    return created;
  });

  return NextResponse.json({ conversation }, { status: 201 });
}
