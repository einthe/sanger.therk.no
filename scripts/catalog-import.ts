import { createHash } from "node:crypto";
import { readdir } from "node:fs/promises";
import { extname, join } from "node:path";
import { compareSongs, normalize, type Song } from "../src/lib/catalog";

const audioExtensions = new Set([".wav", ".mp3", ".flac", ".aif", ".aiff", ".m4a", ".aac", ".ogg", ".opus", ".alac"]);
const excludedDirectories = new Set(["misc", "movie"]);

export function parseSongFilename(filename: string): Omit<Song, "id"> | null {
  const extension = extname(filename);
  if (!audioExtensions.has(extension.toLowerCase()) || filename.startsWith(".")) return null;

  const label = filename.slice(0, -extension.length)
    .normalize("NFC")
    .replace(/\s*[([]\s*(?:qobuz|beatport|itunes)\s*[)\]]/gi, "")
    .replace(/\b(?:qobuz|beatport)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!label) return null;

  // The library uses Title - Artist. Ignore separators inside mix/version labels.
  let depth = 0;
  let separator = -1;
  for (let i = 0; i < label.length; i++) {
    if (label[i] === "(" || label[i] === "[") depth++;
    if (label[i] === ")" || label[i] === "]") depth = Math.max(0, depth - 1);
    if (depth === 0 && label.slice(i, i + 3) === " - ") separator = i;
  }

  return separator < 0
    ? { title: label, artist: "" }
    : { title: label.slice(0, separator).trim(), artist: label.slice(separator + 3).trim() };
}

export async function collectSongs(root: string): Promise<{ songs: Song[]; fileCount: number }> {
  const unique = new Map<string, Song>();
  let fileCount = 0;

  async function visit(directory: string): Promise<void> {
    // Directory entries only: no audio files, tags, or playlist contents are opened.
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name, "en"));
    for (const entry of entries) {
      if (entry.name.startsWith(".")) continue;
      if (entry.isDirectory() && !excludedDirectories.has(entry.name.toLowerCase())) {
        await visit(join(directory, entry.name));
      } else if (entry.isFile()) {
        const song = parseSongFilename(entry.name);
        if (!song) continue;
        fileCount++;
        const key = `${normalize(song.title)}\0${normalize(song.artist)}`;
        if (!unique.has(key)) {
          unique.set(key, { id: createHash("sha256").update(key).digest("hex").slice(0, 16), ...song });
        }
      }
    }
  }

  await visit(root);
  return { songs: [...unique.values()].sort(compareSongs), fileCount };
}
