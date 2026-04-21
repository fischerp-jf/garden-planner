"use client";

import { useEffect, useState } from "react";
import { useGarden } from "@/components/GardenProvider";

export default function SettingsPage() {
  const { garden, loading: gardenLoading, refetch } = useGarden();
  const [name, setName] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!garden) return;
    setName(garden.name);
    setZipCode(garden.zipCode);
  }, [garden]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!garden) return;
    setSaving(true);
    setSaved(false);
    await fetch(`/api/gardens/${garden.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() || garden.name, zipCode: zipCode.trim() }),
    });
    await refetch();
    setSaving(false);
    setSaved(true);
  }

  if (gardenLoading) return <div className="page-shell"><p className="small-note">Loading…</p></div>;

  return (
    <div className="page-shell">
      <header className="page-header">
        <h1>Settings</h1>
        <p>Update your garden name and location for better recommendations.</p>
      </header>

      <form className="journal-form" style={{ maxWidth: 480 }} onSubmit={(e) => { void save(e); }}>
        <div className="journal-form-row">
          <label htmlFor="s-name">Garden name</label>
          <input
            id="s-name"
            type="text"
            value={name}
            maxLength={200}
            onChange={(e) => { setName(e.target.value); setSaved(false); }}
            required
          />
        </div>
        <div className="journal-form-row">
          <label htmlFor="s-zip">ZIP code (US)</label>
          <input
            id="s-zip"
            type="text"
            value={zipCode}
            maxLength={10}
            inputMode="numeric"
            placeholder="e.g. 97214"
            onChange={(e) => { setZipCode(e.target.value); setSaved(false); }}
          />
          <small className="small-note">Used to estimate your USDA hardiness zone and frost dates.</small>
        </div>
        <div style={{ display: "flex", gap: "0.7rem", alignItems: "center" }}>
          <button
            type="submit"
            className="primary-button"
            style={{ width: "auto", marginTop: 0, padding: "0.55rem 1.4rem" }}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved && <span className="small-note" style={{ color: "var(--brand)" }}>Saved.</span>}
        </div>
      </form>
    </div>
  );
}
