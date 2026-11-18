# Sanger

A minimal, mobile-first song catalog built with Next.js, React, TypeScript, and plain CSS. A sticky search field sits above an alphabetical song list, with teal text on black. Search by title and artist, or copy a song name with the copy icon. Misspellings produce ranked close suggestions.

## Run locally

Use Node.js 24 LTS (also specified in `.nvmrc`).

```sh
npm ci
npm run dev
```

Open http://localhost:3000.

## Refresh the songs

The checked-in `src/data/songs.json` contains 406 songs. Hosting and builds use that snapshot and never need access to the original music folder.

```sh
npm run import:songs
```

By default, this scans `~/Music/DJ/Playlists`. To use another source:

```sh
npm run import:songs -- "/path/to/Playlists"
```

The importer only reads directory entries and filenames. It does not open audio files, inspect tags, or read playlist contents. It recursively excludes directories named `MISC` or `Movie` (case-insensitive), hidden directories, and symbolic links. Non-audio files are ignored.

It removes extensions and Qobuz, Beatport, and iTunes labels, separates the usual `Title - Artist` filenames, and preserves mix/version labels. Duplicate normalized title/artist combinations collapse into one entry; different mixes remain separate. The generated catalog contains only an ID, title, and artist. Commit the updated JSON when refreshing the collection.

## Build and host

```sh
npm run build
npm start
```

The production build exports the site to `out/`. Upload that directory to a static host, or configure a Git-connected host with:

- Install: `npm ci`
- Build: `npm run build`
- Output directory: `out`
- Node.js: 24

There is no database, API server, runtime music-folder dependency, or external font request. See [Next.js static export documentation](https://nextjs.org/docs/app/guides/static-exports).

If hosting below a subpath (for example, GitHub Pages project hosting), set `NEXT_PUBLIC_BASE_PATH=/repository-name` at build time. Leave it unset when hosting at a domain root such as `sanger.therk.no`. `public/.nojekyll` is included for GitHub Pages.

## Check the site

```sh
npm test
npm run typecheck
npm run build
npm run test:e2e
```

Unit tests cover filename cleanup, folder exclusions, duplicate handling, and real-catalog search relevance. Browser tests run against the static export on desktop and mobile, including a 320px viewport, scrolling, sticky search, typo suggestions, and clipboard behavior. They use a locally installed Google Chrome. Run `npx playwright install chrome` if Chrome is unavailable. Playwright starts and stops its own local preview server.

Manrope is bundled under the SIL Open Font License; see `src/assets/OFL-Manrope.txt`.
