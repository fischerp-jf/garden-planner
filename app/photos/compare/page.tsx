"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useGarden } from "@/components/GardenProvider";

interface Photo {
  id: string;
  filename: string;
  caption: string | null;
  takenAt: string;
}

function daysBetween(a: string, b: string): number {
  return Math.abs(
    Math.round((new Date(a).getTime() - new Date(b).getTime()) / 86_400_000),
  );
}

export default function ComparePage() {
  const { garden, loading: gardenLoading } = useGarden();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [leftId, setLeftId] = useState("");
  const [rightId, setRightId] = useState("");

  useEffect(() => {
    if (!garden) return;
    void (async () => {
      const res = await fetch(`/api/gardens/${garden.id}`);
      const { garden: g } = (await res.json()) as { garden: { photos: Photo[] } };
      setPhotos(g.photos);
      if (g.photos.length >= 2) {
        setLeftId(g.photos[1].id);
        setRightId(g.photos[0].id);
      }
    })();
  }, [garden]);

  const left = photos.find((p) => p.id === leftId) ?? null;
  const right = photos.find((p) => p.id === rightId) ?? null;
  const diff = left && right ? daysBetween(left.takenAt, right.takenAt) : null;

  if (gardenLoading) return <div className="page-shell"><p className="small-note">Loading…</p></div>;

  return (
    <div className="page-shell">
      <Link href="/photos" className="back-link">← Photos</Link>
      <header className="page-header">
        <h1>Before / After</h1>
        <p>Pick two photos to compare side by side.</p>
      </header>

      <div className="filter-bar" style={{ marginBottom: "1.2rem" }}>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <span className="care-label">Before:</span>
          <select value={leftId} onChange={(e) => setLeftId(e.target.value)}>
            <option value="">— pick —</option>
            {photos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.caption ?? p.filename} ({new Date(p.takenAt).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <span className="care-label">After:</span>
          <select value={rightId} onChange={(e) => setRightId(e.target.value)}>
            <option value="">— pick —</option>
            {photos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.caption ?? p.filename} ({new Date(p.takenAt).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
        {diff !== null && (
          <span className="small-note">{diff} day{diff !== 1 ? "s" : ""} apart</span>
        )}
      </div>

      {left && right ? (
        <div className="compare-layout">
          <div className="compare-col">
            <p className="timeline-day-header">{left.caption ?? left.filename} · {new Date(left.takenAt).toLocaleDateString()}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/photos/${left.id}/file`} alt={left.caption ?? left.filename} className="compare-img" />
          </div>
          <div className="compare-col">
            <p className="timeline-day-header">{right.caption ?? right.filename} · {new Date(right.takenAt).toLocaleDateString()}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/photos/${right.id}/file`} alt={right.caption ?? right.filename} className="compare-img" />
          </div>
        </div>
      ) : (
        <p className="small-note">Select two photos above to compare.</p>
      )}
    </div>
  );
}
