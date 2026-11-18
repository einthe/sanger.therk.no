"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { Song } from "@/lib/catalog";
import { createSongSearch } from "@/lib/search";
import { Icon } from "./icons";

export function SongLibrary({ songs }: { songs: Song[] }) {
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deferredQuery = useDeferredValue(query);
  const search = useMemo(() => createSongSearch(songs), [songs]);
  const result = useMemo(() => search(deferredQuery), [search, deferredQuery]);
  const visibleSongs = result.songs;

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      const typing = /INPUT|TEXTAREA|SELECT/.test(target.tagName) || target.isContentEditable;
      if (((event.metaKey || event.ctrlKey) && event.key === "k") || (event.key === "/" && !typing)) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", focusSearch);
    return () => {
      window.removeEventListener("keydown", focusSearch);
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);

  function clearSearch() {
    setQuery("");
    inputRef.current?.focus();
  }

  async function copySong(song: Song) {
    try {
      await navigator.clipboard.writeText(`${song.title}${song.artist ? ` — ${song.artist}` : ""}`);
      setCopied(song.id);
      setToast("Song name copied");
    } catch {
      setCopied(null);
      setToast("Couldn’t copy. Select the song name to copy it.");
    }
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => { setCopied(null); setToast(""); }, 2600);
  }

  const summary = result.kind === "all"
    ? `${songs.length} songs`
    : result.kind === "suggestions"
      ? `${result.songs.length} close ${result.songs.length === 1 ? "match" : "matches"}`
      : `${result.songs.length} ${result.songs.length === 1 ? "song" : "songs"} found`;

  return (
    <>
      <a className="skip-link" href="#song-list">Skip to songs</a>
      <main className="page-shell" aria-label="Song library">
        <div className="search-dock">
          <form role="search" onSubmit={(event) => { event.preventDefault(); inputRef.current?.blur(); }}>
            <div className="search-field">
              <Icon name="search" />
              <label className="sr-only" htmlFor="song-search">Search songs or artists</label>
              <input
                ref={inputRef}
                id="song-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Escape") clearSearch(); }}
                placeholder="Search songs or artists"
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="none"
                enterKeyHint="search"
                maxLength={160}
                aria-controls="song-list"
              />
              {query && <button className="icon-button clear-search" type="button" onClick={clearSearch} aria-label="Clear search"><Icon name="close" size={18} /></button>}
            </div>
          </form>
        </div>

        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{summary}</p>
        {result.kind === "suggestions" && <p className="result-note">Closest matches</p>}

        <div className="song-list" id="song-list" tabIndex={-1} aria-busy={query !== deferredQuery}>
          {visibleSongs.length ? (
            <ol aria-label={result.kind === "suggestions" ? "Suggested songs" : "Songs"}>
              {visibleSongs.map((song) => (
                <li className="song-row" key={song.id}>
                  <div className="song-info">
                    <h2>{song.title}</h2>
                    {song.artist && <p>{song.artist}</p>}
                  </div>
                  <button
                    className={`icon-button copy-button ${copied === song.id ? "is-copied" : ""}`}
                    type="button"
                    onClick={() => copySong(song)}
                    aria-label={`Copy ${song.title}${song.artist ? ` by ${song.artist}` : ""}`}
                    title="Copy song name"
                  >
                    <Icon name={copied === song.id ? "check" : "copy"} size={17} />
                  </button>
                </li>
              ))}
            </ol>
          ) : <p className="empty-state">No matches</p>}
        </div>
      </main>
      <div className={toast && !copied ? "copy-error" : "sr-only"} role="status" aria-live="polite">{toast}</div>
    </>
  );
}
