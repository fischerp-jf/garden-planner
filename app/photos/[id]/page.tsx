"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Annotation {
  id: string;
  kind: string;
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  label: string | null;
  plantingId: string | null;
  source: string;
}
interface Photo {
  id: string;
  filename: string;
  caption: string | null;
  takenAt: string;
  gardenId: string;
  zoneId: string | null;
}
interface Planting { id: string; catalogId: string; nickname: string | null }

type DrawMode = "box" | "point";

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

export default function PhotoAnnotatorPage() {
  const { id: photoId } = useParams<{ id: string }>();

  const [photo, setPhoto] = useState<Photo | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState<DrawMode>("box");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const drawStart = useRef<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [editLabel, setEditLabel] = useState("");
  const [editPlantingId, setEditPlantingId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!photoId) return;
    void (async () => {
      setLoading(true);
      const res = await fetch(`/api/photos/${photoId}`);
      const data = (await res.json()) as { photo: Photo; annotations: Annotation[] };
      setPhoto(data.photo);
      setAnnotations(data.annotations);

      // Fetch plantings for linking
      const gRes = await fetch(`/api/gardens/${data.photo.gardenId}`);
      const gData = (await gRes.json()) as { garden: { plantings: Planting[] } };
      setPlantings(gData.garden.plantings);
      setLoading(false);
    })();
  }, [photoId]);

  function getSvgPoint(e: React.PointerEvent): { x: number; y: number } | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    return {
      x: clamp01((e.clientX - rect.left) / rect.width),
      y: clamp01((e.clientY - rect.top) / rect.height),
    };
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    const pt = getSvgPoint(e);
    if (!pt) return;
    if (mode === "point") {
      void createAnnotation({ kind: "point", x: pt.x, y: pt.y });
      return;
    }
    drawStart.current = pt;
    setDraft({ x: pt.x, y: pt.y, width: 0, height: 0 });
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!drawStart.current || mode !== "box") return;
    const pt = getSvgPoint(e);
    if (!pt) return;
    const s = drawStart.current;
    setDraft({
      x: Math.min(s.x, pt.x),
      y: Math.min(s.y, pt.y),
      width: Math.abs(pt.x - s.x),
      height: Math.abs(pt.y - s.y),
    });
  }

  function onPointerUp(e: React.PointerEvent<SVGSVGElement>) {
    if (!drawStart.current || !draft || mode !== "box") return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* ok */ }
    const d = draft;
    drawStart.current = null;
    setDraft(null);
    if (d.width < 0.02 || d.height < 0.02) return;
    void createAnnotation({ kind: "box", x: d.x, y: d.y, width: d.width, height: d.height });
  }

  async function createAnnotation(data: { kind: string; x: number; y: number; width?: number; height?: number }) {
    const res = await fetch(`/api/photos/${photoId}/annotations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, source: "manual" }),
    });
    const { annotation } = (await res.json()) as { annotation: Annotation };
    setAnnotations((prev) => [...prev, annotation]);
    setSelectedId(annotation.id);
    setEditLabel(annotation.label ?? "");
    setEditPlantingId(annotation.plantingId ?? "");
  }

  function selectAnnotation(ann: Annotation) {
    setSelectedId(ann.id);
    setEditLabel(ann.label ?? "");
    setEditPlantingId(ann.plantingId ?? "");
  }

  async function saveAnnotationEdit() {
    if (!selectedId) return;
    setSaving(true);
    const body: Record<string, unknown> = { label: editLabel || null };
    body.plantingId = editPlantingId || null;
    const res = await fetch(`/api/annotations/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const { annotation } = (await res.json()) as { annotation: Annotation };
    setAnnotations((prev) => prev.map((a) => (a.id === selectedId ? annotation : a)));
    setSaving(false);
  }

  async function deleteAnnotation(id: string) {
    await fetch(`/api/annotations/${id}`, { method: "DELETE" });
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  if (loading) return <div className="page-shell"><p className="small-note">Loading…</p></div>;
  if (!photo) return <div className="page-shell"><p className="small-note">Photo not found.</p><Link href="/photos" className="back-link">← Photos</Link></div>;

  const selected = annotations.find((a) => a.id === selectedId) ?? null;

  return (
    <div className="page-shell">
      <Link href="/photos" className="back-link">← Photos</Link>
      <header className="page-header">
        <h1>{photo.caption ?? photo.filename}</h1>
        <p>{new Date(photo.takenAt).toLocaleDateString()} · {annotations.length} annotation{annotations.length !== 1 ? "s" : ""}</p>
      </header>

      {/* Mode bar */}
      <div className="filter-bar" style={{ marginBottom: "0.8rem" }}>
        <span className="care-label" style={{ alignSelf: "center" }}>Draw mode:</span>
        <button type="button" className={`tag-chip${mode === "box" ? " selected" : ""}`} onClick={() => setMode("box")}>
          Box
        </button>
        <button type="button" className={`tag-chip${mode === "point" ? " selected" : ""}`} onClick={() => setMode("point")}>
          Point
        </button>
      </div>

      <div className="annotator-layout">
        {/* Canvas */}
        <div className="annotator-canvas">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/photos/${photo.id}/file`} alt={photo.caption ?? photo.filename} draggable={false} />
          <svg
            ref={svgRef}
            className="annotation-svg"
            viewBox="0 0 1 1"
            preserveAspectRatio="none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {annotations.map((ann) => (
              ann.kind === "box" && ann.width != null && ann.height != null ? (
                <rect
                  key={ann.id}
                  x={ann.x} y={ann.y} width={ann.width} height={ann.height}
                  fill={ann.id === selectedId ? "rgba(100,180,60,0.25)" : "rgba(55,91,47,0.15)"}
                  stroke={ann.id === selectedId ? "#4c8c34" : "#375b2f"}
                  strokeWidth="0.004"
                  strokeDasharray={ann.id === selectedId ? "none" : "0.01 0.005"}
                  style={{ cursor: "pointer" }}
                  onClick={() => selectAnnotation(ann)}
                />
              ) : (
                <circle
                  key={ann.id}
                  cx={ann.x} cy={ann.y} r="0.015"
                  fill={ann.id === selectedId ? "#4c8c34" : "#375b2f"}
                  fillOpacity="0.7"
                  stroke="#fff"
                  strokeWidth="0.003"
                  style={{ cursor: "pointer" }}
                  onClick={() => selectAnnotation(ann)}
                />
              )
            ))}
            {/* Draft box during draw */}
            {draft && mode === "box" && (
              <rect
                x={draft.x} y={draft.y} width={draft.width} height={draft.height}
                fill="rgba(193,109,63,0.2)"
                stroke="#c16d3f"
                strokeWidth="0.004"
                strokeDasharray="0.012 0.006"
              />
            )}
            {/* Labels for annotations that have them */}
            {annotations.filter((a) => a.label).map((ann) => (
              <text
                key={`lbl-${ann.id}`}
                x={ann.x + 0.005}
                y={ann.y + 0.025}
                fontSize="0.035"
                fill="#fff"
                style={{ pointerEvents: "none", textShadow: "0 1px 2px #000" }}
              >
                {ann.label}
              </text>
            ))}
          </svg>
        </div>

        {/* Sidebar */}
        <aside className="annotation-sidebar">
          <h3 className="section-heading" style={{ fontSize: "1rem", marginBottom: "0.8rem" }}>
            Annotations ({annotations.length})
          </h3>

          {annotations.length === 0 && (
            <p className="small-note">Draw on the photo to add annotations.</p>
          )}

          <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem" }}>
            {annotations.map((ann) => {
              const linked = plantings.find((p) => p.id === ann.plantingId);
              return (
                <div
                  key={ann.id}
                  className={`annotation-item${selectedId === ann.id ? " selected" : ""}`}
                  onClick={() => selectAnnotation(ann)}
                >
                  <span className="care-label">{ann.kind}</span>
                  <span style={{ fontSize: "0.84rem" }}>{ann.label ?? "(no label)"}</span>
                  {linked && <span className="companion-chip" style={{ alignSelf: "start" }}>{linked.nickname ?? linked.catalogId}</span>}
                </div>
              );
            })}
          </div>

          {selected && (
            <div className="detail-card" style={{ display: "grid", gap: "0.6rem" }}>
              <p className="care-label" style={{ margin: 0 }}>Edit annotation</p>
              <div className="journal-form-row">
                <label htmlFor="ann-label">Label</label>
                <input
                  id="ann-label"
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="What is this?"
                />
              </div>
              <div className="journal-form-row">
                <label htmlFor="ann-planting">Link to plant</label>
                <select id="ann-planting" value={editPlantingId} onChange={(e) => setEditPlantingId(e.target.value)}>
                  <option value="">None</option>
                  {plantings.map((p) => (
                    <option key={p.id} value={p.id}>{p.nickname ?? p.catalogId}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => { void saveAnnotationEdit(); }}
                  disabled={saving}
                  style={{ fontSize: "0.84rem" }}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  style={{ fontSize: "0.84rem", color: "var(--error)", borderColor: "var(--error)" }}
                  onClick={() => { void deleteAnnotation(selected.id); }}
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
