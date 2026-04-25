import type { PrismaClient } from "@/generated/prisma/client";
import { inferUsdaZone, monthName, seasonFromMonth } from "@/lib/climate";
import { PLANTS } from "@/lib/plants";

// Builds the system prompt for /api/chat. Pure-ish function: only dependency
// is a PrismaClient (injectable), so it's unit-testable without Next.js.
//
// Budget: ~2500 tokens total. We section-build and drop trailing sections if
// the running length exceeds budget. Char-based heuristic (len/4 ≈ tokens)
// is good enough — we don't need exact tokenization here.

const BUDGET_CHARS = 10_000; // ~2500 tokens

export interface ChatContextInput {
  db: PrismaClient;
  gardenId: string;
  focus?: { type: "planting" | "zone"; id: string };
  today?: Date;
}

export interface ChatContext {
  systemPrompt: string;
  citedPlantingIds: string[];
  citedZoneIds: string[];
}

function catalogName(id: string): string {
  return PLANTS.find((p) => p.id === id)?.name ?? id;
}

function shadeDescription(level: string | null | undefined): string | null {
  switch (level) {
    case "fully_shaded":
      return "fully shaded";
    case "morning_shade":
      return "morning shade";
    case "afternoon_shade":
      return "afternoon shade";
    default:
      return null;
  }
}

export async function buildChatContext(input: ChatContextInput): Promise<ChatContext | null> {
  const { db, gardenId, focus } = input;
  const today = input.today ?? new Date();
  const month = today.getMonth() + 1;

  const garden = await db.garden.findUnique({ where: { id: gardenId } });
  if (!garden) return null;

  const usdaZone = inferUsdaZone(garden.zipCode);
  const season = seasonFromMonth(month);

  const citedPlantingIds: string[] = [];
  const citedZoneIds: string[] = [];

  // --- Section: Garden (always) -------------------------------------------
  const statusCounts = await db.planting.groupBy({
    by: ["status"],
    where: { gardenId },
    _count: { _all: true },
  });
  const statusLine = statusCounts
    .map((row) => `${row.status}: ${row._count._all}`)
    .join(", ") || "none";

  const zones = await db.zone.findMany({
    where: { gardenId },
    include: { _count: { select: { plantings: true } } },
  });
  const zoneLines = zones.map((z) => {
    const shade = shadeDescription(z.shadeLevel);
    const shadePart = shade ? `, ${shade}` : "";
    return `- ${z.name ?? "(unnamed)"} — ${z.orientation}-facing${shadePart}, ${z._count.plantings} plantings`;
  });

  const sections: string[] = [];
  sections.push(
    `## Garden\n` +
      `- Name: ${garden.name}\n` +
      `- ZIP: ${garden.zipCode} (approx USDA zone ${usdaZone})\n` +
      `- Today: ${today.toISOString().slice(0, 10)} (${monthName(month)}, ${season})\n` +
      `- Planting status: ${statusLine}\n` +
      (zoneLines.length
        ? `- Zones:\n${zoneLines.join("\n")}\n`
        : `- Zones: none defined yet\n`),
  );

  // --- Section: Focus ------------------------------------------------------
  if (focus?.type === "planting") {
    const planting = await db.planting.findUnique({
      where: { id: focus.id },
      include: {
        zone: true,
        journalEntries: { orderBy: { entryDate: "desc" }, take: 10, include: { tags: true } },
      },
    });
    if (planting && planting.gardenId === gardenId) {
      citedPlantingIds.push(planting.id);
      if (planting.zoneId) citedZoneIds.push(planting.zoneId);

      const name = planting.nickname ?? catalogName(planting.catalogId);
      const journalLines = planting.journalEntries.map((e) => {
        const tags = e.tags.map((t) => t.tag).join(",") || "note";
        return `- ${e.entryDate.toISOString().slice(0, 10)} [${tags}] ${e.note.slice(0, 200)}`;
      });

      sections.push(
        `## Focus: Planting "${name}"\n` +
          `- Catalog: ${catalogName(planting.catalogId)} (${planting.catalogId})\n` +
          `- Status: ${planting.status}\n` +
          (planting.plantedAt ? `- Planted: ${planting.plantedAt.toISOString().slice(0, 10)}\n` : "") +
          (planting.removedAt ? `- Removed: ${planting.removedAt.toISOString().slice(0, 10)}\n` : "") +
          (planting.zone
            ? (() => {
                const shade = shadeDescription(planting.zone.shadeLevel);
                const shadeSuffix = shade ? `, ${shade}` : "";
                return `- Zone: ${planting.zone.name ?? "(unnamed)"} (${planting.zone.orientation}-facing${shadeSuffix})\n`;
              })()
            : "") +
          (planting.notes ? `- Notes: ${planting.notes}\n` : "") +
          (journalLines.length
            ? `- Recent journal:\n${journalLines.join("\n")}\n`
            : ""),
      );
    }
  } else if (focus?.type === "zone") {
    const zone = await db.zone.findUnique({
      where: { id: focus.id },
      include: {
        plantings: true,
        journalEntries: { orderBy: { entryDate: "desc" }, take: 10, include: { tags: true } },
      },
    });
    if (zone && zone.gardenId === gardenId) {
      citedZoneIds.push(zone.id);
      citedPlantingIds.push(...zone.plantings.map((p) => p.id));

      const plantingLines = zone.plantings.map(
        (p) => `- ${p.nickname ?? catalogName(p.catalogId)} (${p.status})`,
      );
      const journalLines = zone.journalEntries.map((e) => {
        const tags = e.tags.map((t) => t.tag).join(",") || "note";
        return `- ${e.entryDate.toISOString().slice(0, 10)} [${tags}] ${e.note.slice(0, 200)}`;
      });

      const zoneShade = shadeDescription(zone.shadeLevel);

      sections.push(
        `## Focus: Zone "${zone.name ?? "(unnamed)"}"\n` +
          `- Orientation: ${zone.orientation}\n` +
          (zoneShade ? `- Shade: ${zoneShade}\n` : "") +
          (plantingLines.length ? `- Plantings:\n${plantingLines.join("\n")}\n` : "") +
          (journalLines.length ? `- Recent journal:\n${journalLines.join("\n")}\n` : ""),
      );
    }
  }

  // --- Section: Recent garden-wide journal (if no focus) -------------------
  if (!focus) {
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recent = await db.journalEntry.findMany({
      where: { gardenId, entryDate: { gte: thirtyDaysAgo } },
      orderBy: { entryDate: "desc" },
      take: 10,
      include: { tags: true },
    });
    if (recent.length) {
      const lines = recent.map((e) => {
        const tags = e.tags.map((t) => t.tag).join(",") || "note";
        return `- ${e.entryDate.toISOString().slice(0, 10)} [${tags}] ${e.note.slice(0, 160)}`;
      });
      sections.push(`## Recent journal (last 30 days)\n${lines.join("\n")}\n`);
    }
  }

  // --- Section: Past conversation summaries tied to focus ------------------
  if (focus) {
    const where =
      focus.type === "planting"
        ? { plantings: { some: { plantingId: focus.id } }, status: "approved" }
        : { zones: { some: { zoneId: focus.id } }, status: "approved" };
    const past = await db.conversation.findMany({
      where,
      orderBy: { approvedAt: "desc" },
      take: 3,
    });
    if (past.length) {
      const lines = past.map(
        (c) =>
          `### ${c.title ?? "(untitled)"} — ${c.startedAt.toISOString().slice(0, 10)}\n${c.summary}`,
      );
      sections.push(`## Past Claude conversations\n${lines.join("\n\n")}\n`);
    }
  }

  // --- Assemble with budget -----------------------------------------------
  const header =
    "You are a knowledgeable assistant for a home gardener practicing regenerative and permaculture methods. " +
    "Use the grounded garden context below to answer questions specifically. " +
    "Prefer plants, zones, and journal entries that actually appear in the context over generic advice. " +
    "Cite zone names, planting nicknames, and dates when relevant.\n\n";

  let prompt = header;
  for (const section of sections) {
    if (prompt.length + section.length > BUDGET_CHARS) break;
    prompt += section + "\n";
  }

  return { systemPrompt: prompt, citedPlantingIds, citedZoneIds };
}
