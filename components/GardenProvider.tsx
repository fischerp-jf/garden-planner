"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface GardenSummary {
  id: string;
  name: string;
  zipCode: string;
}

interface GardenContextValue {
  garden: GardenSummary | null;
  loading: boolean;
  refetch: () => void;
}

const GardenContext = createContext<GardenContextValue>({
  garden: null,
  loading: true,
  refetch: () => {},
});

export function GardenProvider({ children }: { children: React.ReactNode }) {
  const [garden, setGarden] = useState<GardenSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/gardens");
      const { gardens } = (await res.json()) as { gardens: GardenSummary[] };

      if (gardens.length > 0) {
        setGarden(gardens[0]);
        return;
      }

      // Auto-create a default garden on first visit (no auth yet).
      const createRes = await fetch("/api/gardens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "My Garden", zipCode: "" }),
      });
      if (!createRes.ok) {
        // Don't pretend a garden exists when the create failed; downstream
        // features that require `garden` will short-circuit, and the error
        // becomes visible instead of silently null-ing the context.
        console.error("Auto-create garden failed", createRes.status, await createRes.text());
        return;
      }
      const { garden: created } = (await createRes.json()) as { garden: GardenSummary };
      setGarden(created);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <GardenContext.Provider value={{ garden, loading, refetch: load }}>
      {children}
    </GardenContext.Provider>
  );
}

export function useGarden(): GardenContextValue {
  return useContext(GardenContext);
}
