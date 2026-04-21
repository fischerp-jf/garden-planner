import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notFound, parseJson, requirePhoto } from "@/lib/api";
import { PhotoPatch } from "@/lib/schemas";
import { deleteFile } from "@/lib/storage";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const photo = await db.photo.findUnique({
    where: { id },
    include: { annotations: true },
  });
  if (!photo) return notFound();
  return NextResponse.json({ photo, annotations: photo.annotations });
}

export async function PATCH(req: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const existing = await requirePhoto(id);
  if (!existing) return notFound();
  const parsed = await parseJson(req, PhotoPatch);
  if (parsed instanceof NextResponse) return parsed;
  const photo = await db.photo.update({ where: { id }, data: parsed });
  return NextResponse.json({ photo });
}

export async function DELETE(_req: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const existing = await requirePhoto(id);
  if (!existing) return notFound();

  // Remove file first; if FS delete fails with a non-ENOENT error, the DB row
  // stays so we can inspect. storage.deleteFile swallows ENOENT for us.
  await deleteFile(existing.url);
  await db.photo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
