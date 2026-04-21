import { notFound, parseJson, serverError } from "@/lib/api";
import { getAnthropic, CHAT_MODEL, MAX_CHAT_TOKENS } from "@/lib/anthropic";
import { buildChatContext } from "@/lib/chatContext";
import { db } from "@/lib/db";
import { ChatRequest } from "@/lib/schemas";

export const runtime = "nodejs";

// Streams an assistant response as Server-Sent Events. Each chunk is emitted
// as `data: <json>\n\n`. The client reconstructs by concatenating `text`
// fields. We do NOT persist anything here — summary-first design means the
// raw transcript is client-owned until the user approves a summary.

export async function POST(req: Request): Promise<Response> {
  const parsed = await parseJson(req, ChatRequest);
  if (parsed instanceof Response) return parsed;

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

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        const response = await anthropic.messages.stream({
          model: CHAT_MODEL,
          max_tokens: MAX_CHAT_TOKENS,
          system: context.systemPrompt,
          messages: parsed.messages.map((m) => ({ role: m.role, content: m.content })),
        });
        for await (const event of response) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            send({ type: "text", text: event.delta.text });
          }
        }
        send({ type: "done" });
      } catch (err) {
        send({ type: "error", error: (err as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

