import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notFound, parseJson, requireConversation } from "@/lib/api";
import { ConversationPatch } from "@/lib/schemas";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const existing = await requireConversation(id);
  if (!existing) return notFound();
  const parsed = await parseJson(req, ConversationPatch);
  if (parsed instanceof NextResponse) return parsed;

  const data: Record<string, unknown> = { ...parsed };
  // If the caller flips status from pending → approved, stamp approvedAt so
  // chatContext can sort past summaries by recency.
  if (parsed.status === "approved" && existing.status !== "approved") {
    data.approvedAt = new Date();
  }

  const conversation = await db.conversation.update({ where: { id }, data });
  return NextResponse.json({ conversation });
}

export async function DELETE(_req: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const existing = await requireConversation(id);
  if (!existing) return notFound();
  await db.conversation.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
