export type Song = {
  id: string;
  title: string;
  artist: string;
};

/** Punctuation and diacritics should not get between someone and a song. */
export function normalize(value: string): string {
  return value
    .toLocaleLowerCase("en")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/ß/g, "ss")
    .replace(/[’'`_]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export const songCollator = new Intl.Collator("en", {
  sensitivity: "base",
  numeric: true,
  ignorePunctuation: true,
});

export function compareSongs(a: Song, b: Song): number {
  return songCollator.compare(a.title, b.title) || songCollator.compare(a.artist, b.artist);
}

export function songLetter(title: string): string {
  const first = normalize(title).charAt(0).toUpperCase();
  return /^[A-Z]$/.test(first) ? first : "#";
}
