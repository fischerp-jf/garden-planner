import { computeRecommendations } from "@/lib/recommend";
import { RecommendationRequest } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

function isOrientation(value: unknown): value is RecommendationRequest["orientation"] {
  return value === "N" || value === "S" || value === "E" || value === "W";
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as Partial<RecommendationRequest>;

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Missing request body." }, { status: 400 });
    }

    if (!isOrientation(body.orientation)) {
      return NextResponse.json({ error: "Orientation must be one of N/S/E/W." }, { status: 400 });
    }

    if (typeof body.month !== "number" || body.month < 1 || body.month > 12) {
      return NextResponse.json({ error: "Month must be between 1 and 12." }, { status: 400 });
    }

    if (!Array.isArray(body.zones) || body.zones.length === 0) {
      return NextResponse.json({ error: "At least one planting zone is required." }, { status: 400 });
    }

    const payload: RecommendationRequest = {
      zipCode: typeof body.zipCode === "string" ? body.zipCode : "",
      orientation: body.orientation,
      month: body.month,
      categories: Array.isArray(body.categories) ? body.categories : [],
      zones: body.zones
    };

    const result = computeRecommendations(payload);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to compute recommendations." }, { status: 500 });
  }
}
