import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";

// Next.js dev reloads modules frequently. Without this guard each reload spawns
// a fresh PrismaClient, eventually exhausting SQLite connections.
declare global {
  var __prisma: PrismaClient | undefined;
}

// Prisma 7 requires a driver adapter. DATABASE_URL points at a relative SQLite
// file; better-sqlite3 wants an absolute path, so resolve from cwd here.
function createClient(): PrismaClient {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
  const filePath = url.startsWith("file:") ? url.slice("file:".length) : url;
  const absolute = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);
  const adapter = new PrismaBetterSqlite3({ url: `file:${absolute}` });
  return new PrismaClient({ adapter });
}

export const db: PrismaClient = globalThis.__prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = db;
}
