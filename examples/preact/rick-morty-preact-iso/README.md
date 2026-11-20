# TanStack Preact Query Rick And Morty Example (preact-iso)

A multi-page Rick and Morty app with characters and episodes, where each page fetches its own data.

Built with [preact-iso](https://github.com/preactjs/preact-iso).

## How it works

- `src/services/characters/queries.ts`, `src/services/episodes/queries.ts`, and `src/services/locations/queries.ts` define `queryOptions` factories (`charactersQueries`, `episodesQueries`, `locationsQueries`) for the Rick and Morty API, each keyed by its domain plus `'list'` or `'detail'` and an id.
- `src/Layout.tsx` defines the `preact-iso` routes, and `src/Characters.tsx` and `src/Episodes.tsx` load their lists with `useQuery`.
- `src/Character.tsx` loads one character, then renders an `Episode` and a `Location` component that each call `useQuery` with their own detail query. `src/Episode.tsx` does the same for the episode's characters, so a character seen on one page is already cached when it shows up on another.

To run this example:

- `npm install`
- `npm run dev`
