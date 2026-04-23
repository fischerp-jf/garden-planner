import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notFound } from "@/lib/api";
import { buildCareAdvice } from "@/lib/care";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const planting = await db.planting.findUnique({
    where: { id },
    include: { garden: true },
  });
  if (!planting) return notFound();

  const advice = buildCareAdvice({
    catalogId: planting.catalogId,
    zipCode: planting.garden.zipCode,
    status: planting.status,
  });
  if (!advice) return notFound("Catalog entry missing");
  return NextResponse.json({ advice });
}
