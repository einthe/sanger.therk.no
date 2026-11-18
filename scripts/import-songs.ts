import { mkdir, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { collectSongs } from "./catalog-import";

async function main() {
  const source = resolve(process.argv[2] || join(homedir(), "Music/DJ/Playlists"));
  const { songs, fileCount } = await collectSongs(source);
  if (!songs.length) throw new Error("No audio filenames found; the existing catalog has been kept.");
  const destination = resolve("src/data/songs.json");
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(`${destination}.tmp`, `${JSON.stringify(songs, null, 2)}\n`, "utf8");
  await rename(`${destination}.tmp`, destination);
  console.log(`Imported ${songs.length} unique songs from ${fileCount} audio filenames. MISC and Movie excluded.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
