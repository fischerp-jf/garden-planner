import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notFound, parseJson, requireAnnotation } from "@/lib/api";
import { AnnotationPatch } from "@/lib/schemas";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const existing = await requireAnnotation(id);
  if (!existing) return notFound();
  const parsed = await parseJson(req, AnnotationPatch);
  if (parsed instanceof NextResponse) return parsed;
  const annotation = await db.photoAnnotation.update({ where: { id }, data: parsed });
  return NextResponse.json({ annotation });
}

export async function DELETE(_req: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const existing = await requireAnnotation(id);
  if (!existing) return notFound();
  await db.photoAnnotation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
