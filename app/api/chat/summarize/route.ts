import { NextResponse } from "next/server";
import { notFound, parseJson, serverError } from "@/lib/api";
import { getAnthropic, SUMMARY_MODEL, MAX_SUMMARY_TOKENS } from "@/lib/anthropic";
import { buildChatContext } from "@/lib/chatContext";
import { db } from "@/lib/db";
import { ChatSummarizeRequest } from "@/lib/schemas";

export const runtime = "nodejs";

// Non-streaming Claude call. Turns a transcript into a reviewable summary
// draft. No DB writes happen here — persistence is a second step gated on
// user approval. Returned JSON is the draft + a suggested title + referenced
// planting/zone IDs (inferred from the focus we sent to the model).

const SUMMARY_SYSTEM = `You produce short, factual summaries of gardening conversations for a gardener's knowledge base.

Output a JSON object with exactly these keys:
- "title": short descriptive title (<= 80 chars)
- "summary": markdown summary (<= 600 chars) of the useful conclusions, decisions, and action items from the conversation. Skip small talk. Speak in the third person about the gardener.
- "referencedPlantingIds": array of planting IDs the conversation actually discussed (subset of the IDs in the system context)
- "referencedZoneIds": array of zone IDs the conversation actually discussed

Return ONLY the JSON object, no prose or code fences.`;

interface SummaryDraft {
  title: string;
  summary: string;
  referencedPlantingIds: string[];
  referencedZoneIds: string[];
}

export async function POST(req: Request): Promise<Response> {
  const parsed = await parseJson(req, ChatSummarizeRequest);
  if (parsed instanceof NextResponse) return parsed;

  const context = await buildChatContext({
    db,
    gardenId: parsed.gardenId,
    focus: parsed.focus,
  });
  if (!context) return notFound("Garden not found");

  let anthropic;
  try {
    anthropic = getAnthropic();
  } catch (err) {
    return serverError((err as Error).message);
  }

  const transcriptText = parsed.transcript
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  const userBlock =
    `## Context\n${context.systemPrompt}\n\n## Transcript\n${transcriptText}\n\nProduce the JSON object now.`;

  const response = await anthropic.messages.create({
    model: SUMMARY_MODEL,
    max_tokens: MAX_SUMMARY_TOKENS,
    system: SUMMARY_SYSTEM,
    messages: [{ role: "user", content: userBlock }],
  });

  const text = response.content
    .flatMap((b) => (b.type === "text" ? [b.text] : []))
    .join("\n")
    .trim();

  let draft: SummaryDraft;
  try {
    draft = JSON.parse(text) as SummaryDraft;
  } catch {
    return NextResponse.json(
      { error: "Model did not return valid JSON", raw: text },
      { status: 422 },
    );
  }

  // Intersect against what context actually cited so bad output can't forge
  // FKs that wouldn't exist at conversation-save time.
  const plantingIds = (draft.referencedPlantingIds ?? []).filter((id) =>
    context.citedPlantingIds.includes(id),
  );
  const zoneIds = (draft.referencedZoneIds ?? []).filter((id) =>
    context.citedZoneIds.includes(id),
  );

  return NextResponse.json({
    draftSummary: draft.summary,
    suggestedTitle: draft.title,
    referencedPlantingIds: plantingIds,
    referencedZoneIds: zoneIds,
  });
}
