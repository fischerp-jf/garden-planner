import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notFound, parseJson, requireJournalEntry } from "@/lib/api";
import { JournalPatch } from "@/lib/schemas";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const existing = await requireJournalEntry(id);
  if (!existing) return notFound();
  const parsed = await parseJson(req, JournalPatch);
  if (parsed instanceof NextResponse) return parsed;

  // Tags are a separate join table. If the client sends `tags`, do a wipe-
  // and-rewrite inside a transaction so the entry never appears with a
  // half-updated tag set.
  const { tags, ...rest } = parsed;

  const entry = await db.$transaction(async (tx) => {
    const updated = await tx.journalEntry.update({ where: { id }, data: rest });
    if (tags !== undefined) {
      await tx.journalEntryTag.deleteMany({ where: { entryId: id } });
      if (tags.length) {
        await tx.journalEntryTag.createMany({
          data: tags.map((tag) => ({ entryId: id, tag })),
        });
      }
    }
    return tx.journalEntry.findUnique({
      where: { id: updated.id },
      include: { tags: true },
    });
  });
  return NextResponse.json({ entry });
}

export async function DELETE(_req: Request, { params }: Params): Promise<NextResponse> {
  const { id } = await params;
  const existing = await requireJournalEntry(id);
  if (!existing) return notFound();
  await db.journalEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
