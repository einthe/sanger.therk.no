import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { collectSongs, parseSongFilename } from "../scripts/catalog-import";

test("removes stores and extensions while keeping mixes and featured artists", () => {
  assert.deepEqual(parseSongFilename("BOTH (MK & Sonny Fodera Remix) - Tiësto, Bia, 21 Savage (Qobuz).wav"), {
    title: "BOTH (MK & Sonny Fodera Remix)", artist: "Tiësto, Bia, 21 Savage",
  });
  assert.deepEqual(parseSongFilename("The Riddle (Original Mix - Radio Edit) - Prezioso, Marvin (Beatport).wav"), {
    title: "The Riddle (Original Mix - Radio Edit)", artist: "Prezioso, Marvin",
  });
  assert.deepEqual(parseSongFilename("BlimE! - Ser Deg - Victor Sotberg, BlimE! (Qobuz).wav"), {
    title: "BlimE! - Ser Deg", artist: "Victor Sotberg, BlimE!",
  });
  assert.deepEqual(parseSongFilename("DANI GIRL PUMPING IT (Remastered).wav"), {
    title: "DANI GIRL PUMPING IT (Remastered)", artist: "",
  });
  assert.equal(parseSongFilename("playlist.m3u"), null);
  assert.equal(parseSongFilename(".DS_Store"), null);
});

test("excludes restricted folders at every depth, ignores links, and deduplicates copies", async () => {
  const root = await mkdtemp(join(tmpdir(), "sanger-import-"));
  try {
    for (const directory of ["Dance", "Dance/Nested", "Dance/mOvIe", "MISC", "Movie", ".hidden"]) {
      await mkdir(join(root, directory), { recursive: true });
    }
    for (const file of [
      "Dance/A Song - Artist (Qobuz).wav",
      "Dance/Nested/A Song - Artist (Beatport).wav",
      "Dance/Nested/A Song (Remix) - Artist.wav",
      "Dance/mOvIe/Excluded nested - Artist.wav",
      "MISC/Excluded misc - Artist.wav",
      "Movie/Excluded movie - Artist.wav",
      ".hidden/Excluded hidden - Artist.wav",
      "Dance/playlist.m3u",
    ]) await writeFile(join(root, file), "");
    await symlink(join(root, "Movie"), join(root, "Linked playlist"));
    const { songs, fileCount } = await collectSongs(root);
    assert.equal(fileCount, 3);
    assert.equal(songs.length, 2);
    assert.ok(songs.every((song) => song.title.startsWith("A Song")));
    assert.deepEqual(await collectSongs(root), { songs, fileCount });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a missing source reports an error instead of replacing the catalog", async () => {
  await assert.rejects(collectSongs(join(tmpdir(), "sanger-path-that-does-not-exist")));
});
