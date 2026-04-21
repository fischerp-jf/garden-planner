import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/api";
import { GardenCreate } from "@/lib/schemas";

export async function GET(): Promise<NextResponse> {
  const gardens = await db.garden.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ gardens });
}

export async function POST(req: Request): Promise<NextResponse> {
  const parsed = await parseJson(req, GardenCreate);
  if (parsed instanceof NextResponse) return parsed;
  const garden = await db.garden.create({ data: parsed });
  return NextResponse.json({ garden }, { status: 201 });
}
