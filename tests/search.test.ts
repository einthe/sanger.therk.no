import assert from "node:assert/strict";
import test from "node:test";
import songs from "../src/data/songs.json";
import { createSongSearch } from "../src/lib/search";
import { normalize } from "../src/lib/catalog";

const search = createSongSearch(songs);

test("the entire catalog is browsable, including blank searches", () => {
  assert.equal(search("").songs.length, songs.length);
  assert.equal(search("  ").kind, "all");
});

test("exact titles rank first and different versions remain available", () => {
  const results = search("Dancing Queen");
  assert.equal(results.kind, "direct");
  assert.equal(results.songs[0].title, "Dancing Queen");
  assert.ok(results.songs.some((song) => song.title === "Dancing Queen (Original Mix)"));
});

test("finds an artist without accents and a title without apostrophes", () => {
  assert.ok(search("tiesto").songs.some((song) => song.artist.includes("Tiësto")));
  assert.ok(search("dont stop me now").songs.some((song) => song.title.startsWith("Don't Stop Me Now")));
  assert.equal(normalize("Åge / Lærer’n / Tiësto"), "age laerern tiesto");
});

test("words can span title and artist in any order", () => {
  assert.equal(search("abba queen dancing").songs[0].title, "Dancing Queen");
  assert.ok(search("gaga telephone").songs.every((song) => song.title.startsWith("Telephone")));
});

test("misspelled titles and artists produce relevant close suggestions", () => {
  for (const query of ["dancng quuen", "dancing qeen", "dancign queen", "abba dancng queen"]) {
    const result = search(query);
    assert.equal(result.kind, "suggestions", query);
    assert.equal(result.songs[0].title, "Dancing Queen", query);
  }
  assert.ok(search("micheal jakson").songs.some((song) => song.artist === "Michael Jackson"));
  assert.ok(search("bohemain rapsody").songs.length === 0, "does not invent songs outside the catalog");
});

test("unrelated searches stay empty instead of presenting arbitrary songs", () => {
  for (const query of ["zzxqqv98765", "nonexistent purple spaceship", "dancing queen zzxqqv98765"]) {
    assert.equal(search(query).kind, "empty", query);
  }
});

test("catalog contains only public song fields and no store labels", () => {
  assert.ok(songs.length > 300);
  assert.equal(new Set(songs.map((song) => song.id)).size, songs.length);
  for (const song of songs) {
    assert.deepEqual(Object.keys(song).sort(), ["artist", "id", "title"]);
    assert.doesNotMatch(`${song.title} ${song.artist}`, /qobuz|beatport|\.wav\b|\/Users\//i);
  }
});
