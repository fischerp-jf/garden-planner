import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notFound, parseJson, requirePhoto } from "@/lib/api";
import { AnnotationCreate } from "@/lib/schemas";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params): Promise<NextResponse> {
  const { id: photoId } = await params;
  const photo = await requirePhoto(photoId);
  if (!photo) return notFound("Photo not found");
  const parsed = await parseJson(req, AnnotationCreate);
  if (parsed instanceof NextResponse) return parsed;

  const annotation = await db.photoAnnotation.create({
    data: { photoId, ...parsed },
  });
  return NextResponse.json({ annotation }, { status: 201 });
}
