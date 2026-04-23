"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Plant } from "@/lib/types";
import type { CareAdvice } from "@/lib/care";
import { useChatFocus } from "@/components/ChatFocusContext";

interface Tag { tag: string }
interface JournalEntry {
  id: string;
  entryDate: string;
  note: string;
  tags: Tag[];
  harvestQuantity: number | null;
  harvestUnit: string | null;
}
interface Annotation { id: string; kind: string; label: string | null; source: string; photoId?: string }
interface PhotoMeta { id: string; caption: string | null; takenAt: string }
interface ConversationSummary {
  id: string;
  title: string | null;
  summary: string;
  startedAt: string;
  status: string;
}
interface PlantingDetail {
  id: string;
  catalogId: string;
  nickname: string | null;
  status: string;
  plantedAt: string | null;
  removedAt: string | null;
  notes: string | null;
  zone: { name: string | null; orientation: string } | null;
}

const STATUS_ORDER = ["planned", "planted", "growing", "harvested", "removed", "died"];

export default function PlantingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { setFocus } = useChatFocus();

  const [planting, setPlanting] = useState<PlantingDetail | null>(null);
  const [catalog, setCatalog] = useState<Plant | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [photos, setPhotos] = useState<PhotoMeta[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [care, setCare] = useState<CareAdvice | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!id) return;
    void (async () => {
      setLoading(true);
      const [detailRes, careRes] = await Promise.all([
        fetch(`/api/plantings/${id}`),
        fetch(`/api/plantings/${id}/care`),
      ]);
      const detail = (await detailRes.json()) as {
        planting: PlantingDetail;
        catalog: Plant | null;
        journalEntries: JournalEntry[];
        annotations: Annotation[];
        conversations: ConversationSummary[];
      };
      setPlanting(detail.planting);
      setCatalog(detail.catalog);
      setJournalEntries(detail.journalEntries);
      setAnnotations(detail.annotations);
      setPhotos((detail as { photos?: PhotoMeta[] }).photos ?? []);
      setConversations(detail.conversations.filter((c) => c.status === "approved"));
      setFocus({ type: "planting", id: detail.planting.id, label: detail.planting.nickname ?? detail.catalog?.name ?? detail.planting.catalogId });
      setStatus(detail.planting.status);

      if (careRes.ok) {
        const careData = (await careRes.json()) as { advice: CareAdvice };
        setCare(careData.advice);
      }
      setLoading(false);
    })();
  }, [id]);

  async function updateStatus(newStatus: string) {
    if (!planting) return;
    setSaving(true);
    await fetch(`/api/plantings/${planting.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setStatus(newStatus);
    setSaving(false);
  }

  if (loading) {
    return <div className="page-shell"><p className="small-note">Loading…</p></div>;
  }

  if (!planting) {
    return (
      <div className="page-shell">
        <p className="small-note">Planting not found.</p>
        <Link href="/plantings" className="back-link">← Back to Plants</Link>
      </div>
    );
  }

  const displayName = planting.nickname ?? catalog?.name ?? planting.catalogId;

  return (
    <div className="page-shell">
      <Link href="/plantings" className="back-link">← Plants</Link>

      <header className="page-header">
        <h1>{displayName}</h1>
        {catalog && <p>{catalog.latinName} · {catalog.notes}</p>}
      </header>

      {/* Status stepper */}
      <div className="filter-bar" style={{ marginBottom: "1.4rem" }}>
        {STATUS_ORDER.map((s) => (
          <button
            key={s}
            type="button"
            className={`tag-chip${status === s ? " selected" : ""}`}
            onClick={() => { void updateStatus(s); }}
            disabled={saving}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        {saving && <span className="small-note">Saving…</span>}
      </div>

      <div className="detail-grid">
        {/* Left col */}
        <div style={{ display: "grid", gap: "1rem" }}>
          {/* Summary card */}
          <div className="detail-card">
            <h3>Details</h3>
            {planting.zone && (
              <p className="small-note">
                Zone: {planting.zone.name ?? "(unnamed)"} · {planting.zone.orientation}-facing
              </p>
            )}
            {planting.plantedAt && (
              <p className="small-note">
                Planted: {new Date(planting.plantedAt).toLocaleDateString()}
              </p>
            )}
            {planting.removedAt && (
              <p className="small-note">
                Removed: {new Date(planting.removedAt).toLocaleDateString()}
              </p>
            )}
            {planting.notes && <p className="small-note">{planting.notes}</p>}
            {annotations.length > 0 && (
              <p className="small-note">{annotations.length} photo annotation{annotations.length !== 1 ? "s" : ""}</p>
            )}
          </div>

          {/* Photo strip */}
          {photos.length > 0 && (
            <div className="detail-card">
              <h3>Photos with this plant</h3>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {photos.map((p) => (
                  <Link key={p.id} href={`/photos/${p.id}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/photos/${p.id}/file`}
                      alt={p.caption ?? ""}
                      style={{ width: 80, height: 80, objectFit: "cover", borderRadius: "0.5rem", border: "1px solid var(--line)" }}
                    />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Care advice */}
          {care && (
            <div className="detail-card">
              <h3>Care this month ({care.monthName})</h3>
              <div className="care-panel">
                <div className="care-row">
                  <span className="care-label">Watering</span>
                  <span>{care.watering}</span>
                </div>
                <div className="care-row">
                  <span className="care-label">Feeding</span>
                  <span>{care.feeding}</span>
                </div>
                <div className="care-row">
                  <span className="care-label">Pruning</span>
                  <span>{care.pruning}</span>
                </div>
                {care.harvestWindow.from && (
                  <div className="care-row">
                    <span className="care-label">Harvest</span>
                    <span>{care.harvestWindow.from} – {care.harvestWindow.to}</span>
                  </div>
                )}
              </div>

              {care.expectedIssuesThisMonth.length > 0 && (
                <div style={{ marginTop: "0.8rem", display: "grid", gap: "0.4rem" }}>
                  {care.expectedIssuesThisMonth.map((issue, i) => (
                    <p key={i} className="care-issue">{issue}</p>
                  ))}
                </div>
              )}

              {care.companionSuggestions.length > 0 && (
                <div style={{ marginTop: "0.8rem" }}>
                  <span className="care-label">Good companions</span>
                  <div className="companion-list">
                    {care.companionSuggestions.map((c) => (
                      <Link key={c.id} href={`/plantings?catalogId=${c.id}`} className="companion-chip">
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right col */}
        <div style={{ display: "grid", gap: "1rem", alignContent: "start" }}>
          {/* Journal */}
          <div className="detail-card">
            <h3>Journal entries</h3>
            {journalEntries.length === 0 ? (
              <p className="small-note">
                No entries yet. <Link href="/journal" style={{ color: "var(--brand)" }}>Add one in the journal.</Link>
              </p>
            ) : (
              <div style={{ display: "grid", gap: "0.6rem" }}>
                {journalEntries.slice(0, 10).map((e) => (
                  <div key={e.id} className="timeline-item">
                    <div className="timeline-item-meta">
                      <span className="small-note">{new Date(e.entryDate).toLocaleDateString()}</span>
                      {e.tags.map((t) => (
                        <span key={t.tag} className="tag-chip">{t.tag.replace(/_/g, " ")}</span>
                      ))}
                      {e.harvestQuantity && (
                        <span className="harvest-badge">
                          {e.harvestQuantity} {e.harvestUnit ?? ""}
                        </span>
                      )}
                    </div>
                    <p className="timeline-item-note">{e.note}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past conversations */}
          {conversations.length > 0 && (
            <div className="detail-card">
              <h3>Past Claude conversations</h3>
              <div style={{ display: "grid", gap: "0.7rem" }}>
                {conversations.map((c) => (
                  <div key={c.id} style={{ fontSize: "0.86rem" }}>
                    <p style={{ margin: "0 0 0.25rem", fontWeight: 700 }}>
                      {c.title ?? "(untitled)"}{" "}
                      <span className="small-note">
                        — {new Date(c.startedAt).toLocaleDateString()}
                      </span>
                    </p>
                    <p style={{ margin: 0, color: "var(--muted)" }}>{c.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
