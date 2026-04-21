"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useGarden } from "@/components/GardenProvider";
import { PLANTS } from "@/lib/plants";

interface Planting {
  id: string;
  catalogId: string;
  nickname: string | null;
  status: string;
  plantedAt: string | null;
  zoneId: string | null;
}

interface Zone {
  id: string;
  name: string | null;
}

const STATUS_OPTIONS = ["planned", "planted", "growing", "harvested", "removed", "died"];

export default function PlantingsPage() {
  const { garden, loading: gardenLoading } = useGarden();
  const [plantings, setPlantings] = useState<Planting[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterZone, setFilterZone] = useState("");

  useEffect(() => {
    if (!garden) return;
    void (async () => {
      setLoading(true);
      const res = await fetch(`/api/gardens/${garden.id}`);
      const data = (await res.json()) as { garden: { plantings: Planting[]; zones: Zone[] } };
      setPlantings(data.garden.plantings);
      setZones(data.garden.zones);
      setLoading(false);
    })();
  }, [garden]);

  const filtered = plantings.filter((p) => {
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterZone && p.zoneId !== filterZone) return false;
    return true;
  });

  if (gardenLoading) {
    return (
      <div className="page-shell">
        <p className="small-note">Loading garden…</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <h1>Plants</h1>
        <p>Everything growing (or planned) in {garden?.name ?? "your garden"}.</p>
      </header>

      <div className="filter-bar">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <select
          value={filterZone}
          onChange={(e) => setFilterZone(e.target.value)}
          aria-label="Filter by zone"
        >
          <option value="">All zones</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>{z.name ?? "(unnamed zone)"}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="small-note">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="small-note">
          No plantings yet.{" "}
          <Link href="/" style={{ color: "var(--brand)" }}>
            Generate a layout on the home page
          </Link>{" "}
          to get started.
        </p>
      ) : (
        <div className="planting-grid">
          {filtered.map((p) => {
            const catalog = PLANTS.find((c) => c.id === p.catalogId);
            const zone = zones.find((z) => z.id === p.zoneId);
            const displayName = p.nickname ?? catalog?.name ?? p.catalogId;
            return (
              <Link key={p.id} href={`/plantings/${p.id}`} className="planting-card">
                <span className={`status-badge ${p.status}`}>{p.status}</span>
                <p className="planting-card-name">{displayName}</p>
                {catalog && <p className="planting-card-latin">{catalog.latinName}</p>}
                {zone && <p className="planting-card-meta">{zone.name ?? "(unnamed zone)"}</p>}
                {p.plantedAt && (
                  <p className="planting-card-meta">
                    Planted {new Date(p.plantedAt).toLocaleDateString()}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
