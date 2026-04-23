import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GardenProvider } from "@/components/GardenProvider";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Regenerative Garden Planner",
  description: "Permaculture-first visual garden planning with climate-aware recommendations."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <GardenProvider>
          <AppShell>{children}</AppShell>
        </GardenProvider>
      </body>
    </html>
  );
}
