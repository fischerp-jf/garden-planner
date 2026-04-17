"use client";

import { monthName } from "@/lib/climate";
import {
  Orientation,
  Plant,
  PlantCategory,
  PlantPlacement,
  PlantRecommendation,
  RecommendationResponse,
  Season,
  ZoneRect
} from "@/lib/types";
import { ChangeEvent, DragEvent, PointerEvent, useMemo, useRef, useState } from "react";

const CATEGORY_OPTIONS: Array<{ value: PlantCategory; label: string }> = [
  { value: "vegetable", label: "Vegetables" },
  { value: "herb", label: "Herbs" },
  { value: "flower", label: "Flowers" },
  { value: "annual", label: "Annuals" },
  { value: "perennial", label: "Perennials" },
  { value: "nitrogen_fixer", label: "Nitrogen Fixers" },
  { value: "pollinator_support", label: "Pollinator Support" }
];

const ORIENTATION_LABELS: Record<Orientation, string> = {
  N: "North is at top",
  S: "North is at bottom",
  E: "North is at right",
  W: "North is at left"
};

const SEASON_COLORS: Record<Season, string> = {
  spring: "#79b66d",
  summer: "#f2b449",
  fall: "#cf8440",
  winter: "#77a3c7"
};

type VisualPlacement = PlantPlacement & { id: string };

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function normalizeRect(start: { x: number; y: number }, end: { x: number; y: number }): Omit<ZoneRect, "id"> {
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(start.x - end.x);
  const height = Math.abs(start.y - end.y);
  return { x, y, width, height };
}

function seasonForMonth(month: number): Season {
  if ([3, 4, 5].includes(month)) {
    return "spring";
  }

  if ([6, 7, 8].includes(month)) {
    return "summer";
  }

  if ([9, 10, 11].includes(month)) {
    return "fall";
  }

  return "winter";
}

function growthFactor(month: number, plant: Plant): number {
  const start = plant.sowMonths[0] ?? plant.transplantMonths[0] ?? month;
  const elapsed = (month - start + 12) % 12;

  if (elapsed <= 1) {
    return 0.38 + elapsed * 0.2;
  }

  if (elapsed <= 3) {
    return 0.64 + (elapsed - 1) * 0.15;
  }

  if (plant.harvestMonths.includes(month)) {
    return 1;
  }

  if (elapsed > 7) {
    return 0.72;
  }

  return 0.92;
}

function monthOptions(): number[] {
  return Array.from({ length: 12 }, (_, index) => index + 1);
}

export default function HomePage() {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [zones, setZones] = useState<ZoneRect[]>([]);
  const [draftZone, setDraftZone] = useState<ZoneRect | null>(null);
  const [orientation, setOrientation] = useState<Orientation>("N");
  const [zipCode, setZipCode] = useState("");
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [categories, setCategories] = useState<PlantCategory[]>(["vegetable", "herb", "flower"]);
  const [plan, setPlan] = useState<RecommendationResponse | null>(null);
  const [visualPlacements, setVisualPlacements] = useState<VisualPlacement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  const recommendationByPlantId = useMemo(() => {
    const map = new Map<string, PlantRecommendation>();
    plan?.recommendations.forEach((recommendation) => {
      map.set(recommendation.plant.id, recommendation);
    });
    return map;
  }, [plan]);

  const activeSeason = seasonForMonth(month);

  function getRelativePointFromPointer(event: PointerEvent<HTMLDivElement>): { x: number; y: number } | null {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) {
      return null;
    }

    return {
      x: clamp01((event.clientX - rect.left) / rect.width),
      y: clamp01((event.clientY - rect.top) / rect.height)
    };
  }

  function getRelativePointFromDrop(event: DragEvent<HTMLDivElement>): { x: number; y: number } | null {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) {
      return null;
    }

    return {
      x: clamp01((event.clientX - rect.left) / rect.width),
      y: clamp01((event.clientY - rect.top) / rect.height)
    };
  }

  function onPhotoUpload(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUrl(String(reader.result));
      setZones([]);
      setDraftZone(null);
      setPlan(null);
      setVisualPlacements([]);
      setError(null);
    };
    reader.readAsDataURL(file);
  }

  function toggleCategory(category: PlantCategory): void {
    setCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category]
    );
  }

  function clearZones(): void {
    setZones([]);
    setDraftZone(null);
    setPlan(null);
    setVisualPlacements([]);
    setError(null);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>): void {
    if (!photoUrl) {
      return;
    }

    const point = getRelativePointFromPointer(event);
    if (!point) {
      return;
    }

    drawStartRef.current = point;
    setIsDrawing(true);
    setDraftZone({ id: "draft", x: point.x, y: point.y, width: 0, height: 0 });
    setError(null);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>): void {
    if (!isDrawing || !drawStartRef.current) {
      return;
    }

    const point = getRelativePointFromPointer(event);
    if (!point) {
      return;
    }

    const rect = normalizeRect(drawStartRef.current, point);
    setDraftZone({ id: "draft", ...rect });
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>): void {
    if (!isDrawing || !drawStartRef.current) {
      return;
    }

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // No-op: pointer may already be released by browser.
    }

    const point = getRelativePointFromPointer(event);
    const start = drawStartRef.current;

    drawStartRef.current = null;
    setIsDrawing(false);

    if (!point) {
      setDraftZone(null);
      return;
    }

    const rect = normalizeRect(start, point);
    setDraftZone(null);

    if (rect.width < 0.03 || rect.height < 0.03) {
      return;
    }

    const newZone: ZoneRect = {
      id: `zone-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ...rect
    };

    setZones((current) => [...current, newZone]);
  }

  async function generatePlan(): Promise<void> {
    if (zones.length === 0) {
      setError("Add at least one planting zone by dragging over the photo.");
      return;
    }

    if (categories.length === 0) {
      setError("Select at least one plant category.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          zipCode,
          orientation,
          month,
          categories,
          zones
        })
      });

      const payload = (await response.json()) as RecommendationResponse | { error?: string };
      if (!response.ok) {
        throw new Error((payload as { error?: string }).error ?? "Unable to generate recommendations.");
      }

      const result = payload as RecommendationResponse;
      setPlan(result);
      setVisualPlacements(
        result.placements.map((placement, index) => ({
          ...placement,
          id: `placement-${index}-${placement.zoneId}-${placement.plantId}`
        }))
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to generate the garden plan.");
    } finally {
      setLoading(false);
    }
  }

  function onDropPlacement(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault();
    if (!plan) {
      return;
    }

    const point = getRelativePointFromDrop(event);
    if (!point) {
      return;
    }

    const movedPlacementId = event.dataTransfer.getData("placementId");
    if (movedPlacementId) {
      setVisualPlacements((current) =>
        current.map((placement) =>
          placement.id === movedPlacementId
            ? {
                ...placement,
                x: point.x,
                y: point.y
              }
            : placement
        )
      );
      return;
    }

    const draggedPlantId = event.dataTransfer.getData("plantId");
    if (!draggedPlantId) {
      return;
    }

    const recommendation = recommendationByPlantId.get(draggedPlantId);
    if (!recommendation) {
      return;
    }

    setVisualPlacements((current) => [
      ...current,
      {
        id: `manual-${Date.now()}-${draggedPlantId}`,
        zoneId: "manual",
        plantId: draggedPlantId,
        x: point.x,
        y: point.y,
        matureSpreadIn: recommendation.plant.matureSpreadIn,
        season: activeSeason,
        color: SEASON_COLORS[activeSeason]
      }
    ]);
  }

  function circleSizePercent(placement: VisualPlacement): number {
    const recommendation = recommendationByPlantId.get(placement.plantId);
    if (!recommendation) {
      return 9;
    }

    const base = Math.min(20, Math.max(6, placement.matureSpreadIn / 2.7));
    return base * growthFactor(month, recommendation.plant);
  }

  return (
    <main className="page-shell">
      <header className="hero">
        <p className="eyebrow">Regenerative Garden Studio</p>
        <h1>Upload your space, map zones, and grow a resilient homestead layout.</h1>
        <p>
          Designed for permaculture-minded growers focused on food density, ecosystem health, and practical seasonal
          planning.
        </p>
      </header>

      <section className="workspace-grid">
        <aside className="control-panel">
          <div className="control-card">
            <h2>1. Upload and Mark Zones</h2>
            <label className="upload-input">
              <span>Garden Photo</span>
              <input type="file" accept="image/*" onChange={onPhotoUpload} />
            </label>
            <p className="small-note">Drag on the photo to draw planting zones (beds, edges, or microclimates).</p>
            <button type="button" className="ghost-button" onClick={clearZones}>
              Clear Zones
            </button>
          </div>

          <div className="control-card">
            <h2>2. Orientation and Climate</h2>
            <p className="small-note">Set where north appears in your photo so sunlight modeling is more realistic.</p>
            <div className="compass-grid" role="radiogroup" aria-label="Orientation selector">
              {(["N", "E", "S", "W"] as Orientation[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`compass-btn ${orientation === value ? "active" : ""}`}
                  onClick={() => setOrientation(value)}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="small-note">{ORIENTATION_LABELS[orientation]}</p>

            <label className="text-input">
              <span>ZIP Code (US)</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={10}
                value={zipCode}
                onChange={(event) => setZipCode(event.target.value)}
                placeholder="e.g. 27513"
              />
            </label>
          </div>

          <div className="control-card">
            <h2>3. Plant Priorities</h2>
            <div className="pill-grid">
              {CATEGORY_OPTIONS.map((category) => {
                const selected = categories.includes(category.value);
                return (
                  <button
                    key={category.value}
                    type="button"
                    className={`pill ${selected ? "selected" : ""}`}
                    onClick={() => toggleCategory(category.value)}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>

            <label className="range-input">
              <span>Timeline Month: {monthName(month)}</span>
              <input
                type="range"
                min={1}
                max={12}
                step={1}
                value={month}
                onChange={(event) => setMonth(Number.parseInt(event.target.value, 10))}
              />
              <div className="month-markers">
                {monthOptions().map((value) => (
                  <span key={value}>{monthName(value).slice(0, 3)}</span>
                ))}
              </div>
            </label>

            <button type="button" className="primary-button" onClick={generatePlan} disabled={loading || !photoUrl}>
              {loading ? "Generating Layout..." : "Generate Smart Layout"}
            </button>
            {error ? <p className="error-text">{error}</p> : null}
          </div>
        </aside>

        <div className="photo-panel">
          <div className="photo-canvas-wrap">
            {photoUrl ? (
              <div
                ref={boardRef}
                className="photo-canvas"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onDragOver={(event) => event.preventDefault()}
                onDrop={onDropPlacement}
              >
                <img src={photoUrl} alt="Uploaded garden space" />

                {zones.map((zone, index) => (
                  <div
                    key={zone.id}
                    className="zone-box"
                    style={{
                      left: `${zone.x * 100}%`,
                      top: `${zone.y * 100}%`,
                      width: `${zone.width * 100}%`,
                      height: `${zone.height * 100}%`
                    }}
                  >
                    <span>
                      Z{index + 1}
                      {plan?.zonesSun[zone.id] ? ` · ${plan.zonesSun[zone.id].replace("_", " ")}` : ""}
                    </span>
                  </div>
                ))}

                {draftZone ? (
                  <div
                    className="zone-box draft"
                    style={{
                      left: `${draftZone.x * 100}%`,
                      top: `${draftZone.y * 100}%`,
                      width: `${draftZone.width * 100}%`,
                      height: `${draftZone.height * 100}%`
                    }}
                  />
                ) : null}

                {visualPlacements.map((placement) => {
                  const recommendation = recommendationByPlantId.get(placement.plantId);
                  const size = circleSizePercent(placement);

                  return (
                    <div
                      key={placement.id}
                      className="plant-circle"
                      draggable
                      onDragStart={(event) => event.dataTransfer.setData("placementId", placement.id)}
                      title={recommendation?.plant.name ?? placement.plantId}
                      style={{
                        left: `${placement.x * 100}%`,
                        top: `${placement.y * 100}%`,
                        width: `${size}%`,
                        height: `${size}%`,
                        borderColor: placement.color,
                        backgroundColor: `${placement.color}55`
                      }}
                    >
                      <span>{recommendation?.plant.name ?? placement.plantId}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="photo-empty">
                <p>Upload a garden photo to start mapping zones and placements.</p>
              </div>
            )}
          </div>

          <div className="drop-hint">
            Drag recommendation chips onto the photo to test alternate layouts. Drag circles to reposition.
          </div>
        </div>
      </section>

      {plan ? (
        <section className="results-grid">
          <article className="result-card">
            <h2>Climate Snapshot</h2>
            <p>
              USDA Zone: <strong>{plan.usdaZone}</strong>
            </p>
            <p>
              Last Spring Frost: <strong>{plan.frostDates.lastSpring}</strong>
            </p>
            <p>
              First Fall Frost: <strong>{plan.frostDates.firstFall}</strong>
            </p>
          </article>

          <article className="result-card wide">
            <h2>Recommended Plants (Top 10)</h2>
            <div className="recommend-grid">
              {plan.recommendations.map((recommendation) => (
                <div key={recommendation.plant.id} className="recommend-card">
                  <button
                    type="button"
                    className="drag-chip"
                    draggable
                    onDragStart={(event) => event.dataTransfer.setData("plantId", recommendation.plant.id)}
                  >
                    Drag {recommendation.plant.name}
                  </button>
                  <h3>{recommendation.plant.name}</h3>
                  <p className="latin">{recommendation.plant.latinName}</p>
                  <p className="small-note">{recommendation.reasons.join(" • ")}</p>
                  <p className="small-note">
                    Companion matches: {recommendation.companions.length ? recommendation.companions.join(", ") : "None yet"}
                  </p>
                  {recommendation.warnings.length ? <p className="warn">{recommendation.warnings.join(" • ")}</p> : null}
                </div>
              ))}
            </div>
          </article>

          <article className="result-card wide">
            <h2>Personalized Planting Calendar</h2>
            <div className="calendar-grid">
              {plan.calendar.map((entry, index) => (
                <div key={`${entry.plantId}-${entry.task}-${entry.month}-${index}`} className="calendar-item">
                  <p>
                    <strong>{monthName(entry.month)}</strong> · {entry.task.toUpperCase()} · {entry.plantName}
                  </p>
                  <p>{entry.notes}</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}
    </main>
  );
}
