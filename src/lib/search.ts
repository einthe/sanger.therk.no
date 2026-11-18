import Fuse from "fuse.js";
import { compareSongs, normalize, type Song } from "./catalog";

export type SearchResult = { songs: Song[]; kind: "all" | "direct" | "suggestions" | "empty" };

export function createSongSearch(songs: Song[]) {
  const indexed = songs.map((song) => ({
    song,
    title: normalize(song.title),
    artist: normalize(song.artist),
    combined: normalize(`${song.title} ${song.artist}`),
  }));
  const fuse = new Fuse(indexed, {
    keys: [{ name: "title", weight: 0.7 }, { name: "artist", weight: 0.3 }],
    threshold: 0.34,
    ignoreLocation: true,
    ignoreFieldNorm: true,
    includeScore: true,
  });

  return (query: string): SearchResult => {
    const cleaned = normalize(query).slice(0, 160);
    if (!cleaned) return { songs, kind: "all" };
    const tokens = [...new Set(cleaned.split(/\s+/))];
    const direct = indexed.filter((entry) => tokens.every((token) => entry.combined.includes(token)));

    const directRank = (entry: (typeof indexed)[number]) =>
      entry.title === cleaned ? 0 : entry.title.startsWith(cleaned) ? 1 : entry.title.includes(cleaned) ? 2 : entry.artist === cleaned ? 3 : 4;

    if (direct.length) {
      return {
        songs: direct.sort((a, b) => directRank(a) - directRank(b) || compareSongs(a.song, b.song)).map((entry) => entry.song),
        kind: "direct",
      };
    }

    // Match every word independently, so artist/title order and a typo in either work.
    // Short words must match directly to avoid noisy one-letter suggestions.
    const tokenMatches = tokens.map((token) => {
      const matches = new Map<string, number>();
      if (token.length >= 3) {
        for (const result of fuse.search(token)) matches.set(result.item.song.id, result.score ?? 1);
      }
      for (const entry of indexed) {
        if (entry.combined.includes(token)) matches.set(entry.song.id, 0);
      }
      return matches;
    });
    const suggestions = songs
      .filter((song) => tokenMatches.every((matches) => matches.has(song.id)))
      .map((song) => ({ song, score: tokenMatches.reduce((sum, matches) => sum + (matches.get(song.id) ?? 1), 0) / tokens.length }))
      .sort((a, b) => a.score - b.score || compareSongs(a.song, b.song))
      .slice(0, 12)
      .map(({ song }) => song);

    return { songs: suggestions, kind: suggestions.length ? "suggestions" : "empty" };
  };
}
