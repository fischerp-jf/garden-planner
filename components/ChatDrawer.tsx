"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useGarden } from "@/components/GardenProvider";
import { useChatFocus } from "@/components/ChatFocusContext";
import { SummaryReviewModal } from "@/components/SummaryReviewModal";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SummaryDraft {
  draftSummary: string;
  suggestedTitle: string;
  referencedPlantingIds: string[];
  referencedZoneIds: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const IDLE_MS = 15 * 60 * 1000;

export function ChatDrawer({ open, onClose }: Props) {
  const { garden } = useGarden();
  const { focus } = useChatFocus();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [draft, setDraft] = useState<SummaryDraft | null>(null);
  const [idleWarning, setIdleWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reset idle timer on activity.
  const resetIdle = useCallback(() => {
    setIdleWarning(false);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (messages.length > 0) setIdleWarning(true);
    }, IDLE_MS);
  }, [messages.length]);

  useEffect(() => {
    if (open && messages.length > 0) resetIdle();
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
  }, [open, messages.length, resetIdle]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || !garden || streaming) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);
    setError(null);
    resetIdle();

    // Placeholder for streaming response.
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    abortRef.current = new AbortController();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gardenId: garden.id,
          focus: focus ? { type: focus.type, id: focus.id } : undefined,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Chat failed");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const chunks = buf.split("\n\n");
        buf = chunks.pop() ?? "";
        for (const chunk of chunks) {
          if (!chunk.startsWith("data: ")) continue;
          try {
            const obj = JSON.parse(chunk.slice(6)) as { type: string; text?: string; error?: string };
            if (obj.type === "text" && obj.text) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: (updated[updated.length - 1].content) + obj.text!,
                };
                return updated;
              });
            }
            if (obj.type === "error") throw new Error(obj.error);
          } catch { /* malformed SSE chunk — skip */ }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError((err as Error).message);
        setMessages((prev) => prev.slice(0, -1)); // remove empty placeholder
      }
    } finally {
      setStreaming(false);
    }
  }

  async function endConversation() {
    if (!garden || messages.length < 2) return;
    setSummarizing(true);
    setError(null);
    try {
      const res = await fetch("/api/chat/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gardenId: garden.id,
          focus: focus ? { type: focus.type, id: focus.id } : undefined,
          transcript: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? "Summarize failed");
      }
      const data = (await res.json()) as SummaryDraft;
      setDraft(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSummarizing(false);
    }
  }

  async function approveAndSave(summary: string, title: string) {
    if (!garden || !draft) return;
    const startedAt = messages.length > 0 ? new Date().toISOString() : new Date().toISOString();
    await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gardenId: garden.id,
        title: title || undefined,
        summary,
        startedAt,
        plantingIds: draft.referencedPlantingIds,
        zoneIds: draft.referencedZoneIds,
      }),
    });
    setDraft(null);
    setMessages([]);
    onClose();
  }

  function discardDraft() {
    setDraft(null);
    setMessages([]);
    onClose();
  }

  if (!open) return null;

  return (
    <>
      <aside className="chat-drawer" role="complementary" aria-label="Garden chat">
        <div className="chat-drawer-header">
          <div>
            <span className="chat-drawer-title">Ask Claude</span>
            {focus && (
              <span className="chat-focus-badge">{focus.label}</span>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            {messages.length >= 2 && !streaming && (
              <button
                type="button"
                className="ghost-button"
                style={{ fontSize: "0.78rem", padding: "0.3rem 0.6rem" }}
                onClick={() => { void endConversation(); }}
                disabled={summarizing}
              >
                {summarizing ? "Summarizing…" : "End & save"}
              </button>
            )}
            <button type="button" className="ghost-button" style={{ fontSize: "0.78rem", padding: "0.3rem 0.5rem" }} onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {idleWarning && (
          <div className="idle-banner">
            Still there? Don't forget to end and save your conversation when done.
          </div>
        )}

        <div className="chat-messages">
          {messages.length === 0 && (
            <p className="small-note" style={{ textAlign: "center", paddingTop: "2rem" }}>
              Ask about your garden, plants, care timing, or companion planting.
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`chat-message ${m.role}`}>
              <div className="chat-message-content">
                {m.content || (m.role === "assistant" && streaming ? <span className="chat-cursor" /> : null)}
              </div>
            </div>
          ))}
          {error && <p className="error-text" style={{ padding: "0.5rem 1rem" }}>{error}</p>}
          <div ref={bottomRef} />
        </div>

        <form
          className="chat-composer"
          onSubmit={(e) => { e.preventDefault(); void sendMessage(); }}
        >
          <textarea
            className="chat-input"
            rows={2}
            placeholder="Ask about your garden…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
            disabled={streaming}
          />
          <button
            type="submit"
            className="primary-button"
            style={{ width: "auto", margin: 0, padding: "0.5rem 1rem", fontSize: "0.84rem" }}
            disabled={streaming || !input.trim()}
          >
            Send
          </button>
        </form>

        <p className="small-note" style={{ padding: "0.4rem 0.8rem 0.6rem", margin: 0, fontSize: "0.72rem", color: "var(--muted)" }}>
          Closing this panel without ending will discard the conversation.
        </p>
      </aside>

      {draft && (
        <SummaryReviewModal
          draftSummary={draft.draftSummary}
          suggestedTitle={draft.suggestedTitle}
          plantingIds={draft.referencedPlantingIds}
          zoneIds={draft.referencedZoneIds}
          onApprove={(s, t) => { void approveAndSave(s, t); }}
          onDiscard={discardDraft}
          onClose={() => setDraft(null)}
        />
      )}
    </>
  );
}
