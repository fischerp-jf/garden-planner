"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useGarden } from "@/components/GardenProvider";

interface Photo {
  id: string;
  filename: string;
  caption: string | null;
  takenAt: string;
  zoneId: string | null;
}
interface Zone { id: string; name: string | null }

export default function PhotosPage() {
  const { garden, loading: gardenLoading } = useGarden();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadZone, setUploadZone] = useState("");
  const [uploadCaption, setUploadCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!garden) return;
    void (async () => {
      setLoading(true);
      const res = await fetch(`/api/gardens/${garden.id}`);
      const { garden: g } = (await res.json()) as { garden: { photos: Photo[]; zones: Zone[] } };
      setPhotos(g.photos);
      setZones(g.zones);
      setLoading(false);
    })();
  }, [garden]);

  async function upload(file: File) {
    if (!garden) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const meta: Record<string, string> = { takenAt: new Date().toISOString() };
    if (uploadZone) meta.zoneId = uploadZone;
    if (uploadCaption) meta.caption = uploadCaption;
    fd.append("metadata", JSON.stringify(meta));
    const res = await fetch(`/api/gardens/${garden.id}/photos`, { method: "POST", body: fd });
    const { photo } = (await res.json()) as { photo: Photo };
    setPhotos((prev) => [photo, ...prev]);
    setUploadCaption("");
    setUploading(false);
  }

  if (gardenLoading) return <div className="page-shell"><p className="small-note">Loading…</p></div>;

  return (
    <div className="page-shell">
      <header className="page-header">
        <h1>Photos</h1>
        <p>Upload garden photos and annotate plantings directly on the image.</p>
      </header>

      {/* Upload form */}
      <div className="journal-form" style={{ marginBottom: "1.4rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
          <div className="journal-form-row">
            <label htmlFor="up-caption">Caption (optional)</label>
            <input
              id="up-caption"
              type="text"
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
              placeholder="e.g. South bed, mid-July"
            />
          </div>
          <div className="journal-form-row">
            <label htmlFor="up-zone">Zone (optional)</label>
            <select id="up-zone" value={uploadZone} onChange={(e) => setUploadZone(e.target.value)}>
              <option value="">None</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name ?? "(unnamed)"}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.7rem", alignItems: "center" }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }}
          />
          <button
            type="button"
            className="primary-button"
            style={{ width: "auto", marginTop: 0, padding: "0.55rem 1.4rem" }}
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : "Upload photo"}
          </button>
          {photos.length > 1 && (
            <Link href="/photos/compare" className="ghost-button" style={{ fontSize: "0.84rem" }}>
              Compare two photos
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <p className="small-note">Loading…</p>
      ) : photos.length === 0 ? (
        <p className="small-note">No photos yet. Upload one above to start annotating.</p>
      ) : (
        <div className="photo-grid">
          {photos.map((p) => (
            <Link key={p.id} href={`/photos/${p.id}`} className="photo-thumb-card">
              <div className="photo-thumb-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/photos/${p.id}/file`} alt={p.caption ?? p.filename} loading="lazy" />
              </div>
              <div className="photo-thumb-meta">
                <p className="photo-thumb-caption">{p.caption ?? p.filename}</p>
                <p className="photo-thumb-date">{new Date(p.takenAt).toLocaleDateString()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
