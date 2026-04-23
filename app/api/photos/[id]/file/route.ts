import { Readable } from "node:stream";
import { notFound, requirePhoto } from "@/lib/api";
import { readStream } from "@/lib/storage";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params): Promise<Response> {
  const { id } = await params;
  const photo = await requirePhoto(id);
  if (!photo) return notFound();

  const nodeStream = readStream(photo.url);
  // Convert Node Readable → Web ReadableStream for the Response body.
  const webStream = Readable.toWeb(nodeStream as Readable) as ReadableStream<Uint8Array>;

  return new Response(webStream, {
    status: 200,
    headers: {
      "Content-Type": photo.mimeType || "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
