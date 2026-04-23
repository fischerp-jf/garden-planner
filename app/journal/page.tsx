"use client";

import Link from "next/link";
import { useEffect, useReducer, useState } from "react";
import { useGarden } from "@/components/GardenProvider";

const JOURNAL_TAGS = [
  "watered",
  "fertilized",
  "pruned",
  "harvested",
  "pest_observed",
  "disease_observed",
  "weather_event",
];

interface Tag { tag: string }
interface JournalEntry {
  id: string;
  entryDate: string;
  note: string;
  tags: Tag[];
  harvestQuantity: number | null;
  harvestUnit: string | null;
  plantingId: string | null;
  zoneId: string | null;
}
interface Planting { id: string; catalogId: string; nickname: string | null }
interface Zone { id: string; name: string | null }

interface FormState {
  entryDate: string;
  note: string;
  tags: string[];
  plantingId: string;
  zoneId: string;
  harvestQuantity: string;
  harvestUnit: string;
}

type FormAction =
  | { type: "set"; field: keyof FormState; value: string }
  | { type: "toggle_tag"; tag: string }
  | { type: "reset"; today: string };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "set":
      return { ...state, [action.field]: action.value };
    case "toggle_tag":
      return {
        ...state,
        tags: state.tags.includes(action.tag)
          ? state.tags.filter((t) => t !== action.tag)
          : [...state.tags, action.tag],
      };
    case "reset":
      return initialForm(action.today);
  }
}

function initialForm(today: string): FormState {
  return { entryDate: today, note: "", tags: [], plantingId: "", zoneId: "", harvestQuantity: "", harvestUnit: "" };
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function groupByDay(entries: JournalEntry[]): [string, JournalEntry[]][] {
  const map = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    const day = e.entryDate.slice(0, 10);
    const arr = map.get(day) ?? [];
    arr.push(e);
    map.set(day, arr);
  }
  return Array.from(map.entries());
}

export default function JournalPage() {
  const { garden, loading: gardenLoading } = useGarden();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filterTag, setFilterTag] = useState("");

  const today = todayString();
  const [form, dispatch] = useReducer(formReducer, today, initialForm);

  useEffect(() => {
    if (!garden) return;
    void (async () => {
      setLoading(true);
      const [journalRes, gardenRes] = await Promise.all([
        fetch(`/api/gardens/${garden.id}/journal`),
        fetch(`/api/gardens/${garden.id}`),
      ]);
      const { entries: es } = (await journalRes.json()) as { entries: JournalEntry[] };
      const { garden: g } = (await gardenRes.json()) as { garden: { plantings: Planting[]; zones: Zone[] } };
      setEntries(es);
      setPlantings(g.plantings);
      setZones(g.zones);
      setLoading(false);
    })();
  }, [garden]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!garden || !form.note.trim()) return;
    setSubmitting(true);

    const body: Record<string, unknown> = {
      entryDate: form.entryDate,
      note: form.note,
      tags: form.tags,
    };
    if (form.plantingId) body.plantingId = form.plantingId;
    if (form.zoneId) body.zoneId = form.zoneId;
    if (form.harvestQuantity) body.harvestQuantity = parseFloat(form.harvestQuantity);
    if (form.harvestUnit) body.harvestUnit = form.harvestUnit;

    const res = await fetch(`/api/gardens/${garden.id}/journal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const { entry } = (await res.json()) as { entry: JournalEntry };
    setEntries((prev) => [entry, ...prev]);
    dispatch({ type: "reset", today });
    setSubmitting(false);
  }

  const filtered = filterTag
    ? entries.filter((e) => e.tags.some((t) => t.tag === filterTag))
    : entries;

  const grouped = groupByDay(filtered);
  const hasHarvest = form.tags.includes("harvested");

  if (gardenLoading) {
    return <div className="page-shell"><p className="small-note">Loading garden…</p></div>;
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <h1>Journal</h1>
        <p>Track care events, harvests, and observations for {garden?.name ?? "your garden"}.</p>
      </header>

      {/* Create form */}
      <form className="journal-form" onSubmit={(e) => { void submit(e); }}>
        <div className="journal-form-row">
          <label htmlFor="jf-date">Date</label>
          <input
            id="jf-date"
            type="date"
            value={form.entryDate}
            max={today}
            onChange={(e) => dispatch({ type: "set", field: "entryDate", value: e.target.value })}
          />
        </div>

        <div className="journal-form-row">
          <label htmlFor="jf-note">Note</label>
          <textarea
            id="jf-note"
            rows={3}
            placeholder="What did you observe or do?"
            value={form.note}
            onChange={(e) => dispatch({ type: "set", field: "note", value: e.target.value })}
            required
          />
        </div>

        <div className="journal-form-row">
          <label>Tags</label>
          <div className="journal-form-tags">
            {JOURNAL_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`tag-chip${form.tags.includes(tag) ? " selected" : ""}`}
                onClick={() => dispatch({ type: "toggle_tag", tag })}
              >
                {tag.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>

        {hasHarvest && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
            <div className="journal-form-row">
              <label htmlFor="jf-qty">Harvest quantity</label>
              <input
                id="jf-qty"
                type="number"
                min="0"
                step="any"
                placeholder="0.5"
                value={form.harvestQuantity}
                onChange={(e) => dispatch({ type: "set", field: "harvestQuantity", value: e.target.value })}
              />
            </div>
            <div className="journal-form-row">
              <label htmlFor="jf-unit">Unit</label>
              <input
                id="jf-unit"
                type="text"
                placeholder="lb, oz, each…"
                value={form.harvestUnit}
                onChange={(e) => dispatch({ type: "set", field: "harvestUnit", value: e.target.value })}
              />
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
          <div className="journal-form-row">
            <label htmlFor="jf-planting">Link to plant (optional)</label>
            <select
              id="jf-planting"
              value={form.plantingId}
              onChange={(e) => dispatch({ type: "set", field: "plantingId", value: e.target.value })}
            >
              <option value="">None</option>
              {plantings.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nickname ?? p.catalogId}
                </option>
              ))}
            </select>
          </div>

          <div className="journal-form-row">
            <label htmlFor="jf-zone">Link to zone (optional)</label>
            <select
              id="jf-zone"
              value={form.zoneId}
              onChange={(e) => dispatch({ type: "set", field: "zoneId", value: e.target.value })}
            >
              <option value="">None</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name ?? "(unnamed zone)"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="primary-button journal-form-submit"
          disabled={submitting || !form.note.trim()}
          style={{ width: "auto", marginTop: 0, padding: "0.55rem 1.4rem" }}
        >
          {submitting ? "Saving…" : "Add entry"}
        </button>
      </form>

      {/* Filter bar */}
      <div className="filter-bar">
        <select
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          aria-label="Filter by tag"
        >
          <option value="">All tags</option>
          {JOURNAL_TAGS.map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
          ))}
        </select>
        {filterTag && (
          <button
            type="button"
            className="ghost-button"
            style={{ fontSize: "0.82rem", padding: "0.3rem 0.55rem" }}
            onClick={() => setFilterTag("")}
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Timeline */}
      {loading ? (
        <p className="small-note">Loading…</p>
      ) : grouped.length === 0 ? (
        <p className="small-note">No entries yet. Use the form above to log your first one.</p>
      ) : (
        grouped.map(([day, dayEntries]) => (
          <div key={day} className="timeline-day">
            <p className="timeline-day-header">
              {new Date(day + "T12:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            {dayEntries.map((entry) => {
              const plant = entry.plantingId
                ? plantings.find((p) => p.id === entry.plantingId)
                : null;
              const zone = entry.zoneId
                ? zones.find((z) => z.id === entry.zoneId)
                : null;
              return (
                <div key={entry.id} className="timeline-item">
                  <div className="timeline-item-meta">
                    {entry.tags.map((t) => (
                      <button
                        key={t.tag}
                        type="button"
                        className="tag-chip"
                        onClick={() => setFilterTag(t.tag)}
                        title={`Filter by ${t.tag}`}
                      >
                        {t.tag.replace(/_/g, " ")}
                      </button>
                    ))}
                    {plant && (
                      <Link
                        href={`/plantings/${plant.id}`}
                        className="companion-chip"
                      >
                        {plant.nickname ?? plant.catalogId}
                      </Link>
                    )}
                    {zone && <span className="tag-chip">{zone.name ?? "unnamed zone"}</span>}
                    {entry.harvestQuantity !== null && (
                      <span className="harvest-badge">
                        {entry.harvestQuantity} {entry.harvestUnit ?? ""}
                      </span>
                    )}
                  </div>
                  <p className="timeline-item-note">{entry.note}</p>
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
