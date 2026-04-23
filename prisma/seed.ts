// Seed stub. Intentionally a no-op for Phase 2 — wiring is in place so we
// can add real fixtures later without editing package.json or docs.
//
// Run via: npm run seed

import { db } from "../lib/db";

async function main() {
  // No-op.
  void db;
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
