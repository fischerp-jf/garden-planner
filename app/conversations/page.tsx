"use client";

import { useEffect, useState } from "react";
import { useGarden } from "@/components/GardenProvider";

interface JunctionPlanting { plantingId: string }
interface JunctionZone { zoneId: string }
interface Conversation {
  id: string;
  title: string | null;
  summary: string;
  startedAt: string;
  approvedAt: string | null;
  status: string;
  plantings: JunctionPlanting[];
  zones: JunctionZone[];
}

export default function ConversationsPage() {
  const { garden, loading: gardenLoading } = useGarden();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!garden) return;
    void (async () => {
      setLoading(true);
      const res = await fetch(`/api/conversations?gardenId=${garden.id}&status=approved`);
      const { conversations: cs } = (await res.json()) as { conversations: Conversation[] };
      setConversations(cs);
      setLoading(false);
    })();
  }, [garden]);

  async function deleteConversation(id: string) {
    setDeleting(id);
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setDeleting(null);
  }

  if (gardenLoading) return <div className="page-shell"><p className="small-note">Loading…</p></div>;

  return (
    <div className="page-shell">
      <header className="page-header">
        <h1>Conversations</h1>
        <p>
          Approved summaries from past Claude chats. These feed into future conversations as context.
          Start a new chat by clicking <strong>Chat</strong> in the top-right.
        </p>
      </header>

      {loading ? (
        <p className="small-note">Loading…</p>
      ) : conversations.length === 0 ? (
        <p className="small-note">No saved conversations yet. End a chat and approve the summary to create one.</p>
      ) : (
        <div style={{ display: "grid", gap: "0.9rem" }}>
          {conversations.map((c) => (
            <div key={c.id} className="detail-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                <div>
                  <h3 style={{ margin: "0 0 0.2rem", fontSize: "1rem", fontFamily: "inherit" }}>
                    {c.title ?? "(untitled)"}
                  </h3>
                  <p className="small-note" style={{ margin: "0 0 0.6rem" }}>
                    {new Date(c.startedAt).toLocaleDateString(undefined, {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                    {c.plantings.length > 0 && ` · ${c.plantings.length} plant${c.plantings.length !== 1 ? "s" : ""}`}
                    {c.zones.length > 0 && ` · ${c.zones.length} zone${c.zones.length !== 1 ? "s" : ""}`}
                  </p>
                </div>
                <button
                  type="button"
                  className="ghost-button"
                  style={{ fontSize: "0.78rem", padding: "0.25rem 0.55rem", color: "var(--muted)", flexShrink: 0 }}
                  onClick={() => { void deleteConversation(c.id); }}
                  disabled={deleting === c.id}
                >
                  {deleting === c.id ? "Deleting…" : "Delete"}
                </button>
              </div>
              <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--muted)", lineHeight: 1.55 }}>
                {c.summary}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
