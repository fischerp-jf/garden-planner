import { createReadStream } from "node:fs";
import { mkdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Photos live outside /public so they aren't bundled with the build and so we
// can layer access control in later. Serving goes through /api/photos/[id]/file,
// which streams the file via readStream().
//
// The `url` column stored on Photo rows is an opaque handle — not an HTTP path.
// Today the handle is just the object key; tomorrow it could prefix an S3 URL.
// Downstream code must never parse it, only pass it back to this module.

const UPLOAD_ROOT =
  process.env.UPLOAD_DIR ?? path.resolve(process.cwd(), "uploads");

export type StorageKey = string; // e.g. "<gardenId>/<photoId>.jpg"

function resolveAbsolute(key: StorageKey): string {
  // Refuse traversal — defence-in-depth even though keys are always generated
  // server-side from cuids.
  const abs = path.resolve(UPLOAD_ROOT, key);
  if (!abs.startsWith(UPLOAD_ROOT + path.sep) && abs !== UPLOAD_ROOT) {
    throw new Error(`Invalid storage key: ${key}`);
  }
  return abs;
}

export async function saveFile(
  key: StorageKey,
  bytes: Buffer | Uint8Array,
): Promise<void> {
  const abs = resolveAbsolute(key);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, bytes);
}

export function readStream(key: StorageKey): NodeJS.ReadableStream {
  return createReadStream(resolveAbsolute(key));
}

export async function deleteFile(key: StorageKey): Promise<void> {
  try {
    await unlink(resolveAbsolute(key));
  } catch (err: unknown) {
    // Missing file on delete is not fatal — the caller is trying to tear down
    // state and we don't want a stray orphan to block the DB row removal.
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }
}

export async function exists(key: StorageKey): Promise<boolean> {
  try {
    await stat(resolveAbsolute(key));
    return true;
  } catch {
    return false;
  }
}

// Callers should use this rather than constructing URLs directly, so swapping
// to S3 later is a one-file change.
export function getPublicUrl(photoId: string): string {
  return `/api/photos/${photoId}/file`;
}

export function buildStorageKey(
  gardenId: string,
  photoId: string,
  ext: string,
): StorageKey {
  const safeExt = ext.replace(/[^a-z0-9]/gi, "").toLowerCase() || "bin";
  return `${gardenId}/${photoId}.${safeExt}`;
}
