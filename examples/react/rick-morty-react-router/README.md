# TanStack React Query Rick And Morty Example (React Router)

A multi-page Rick and Morty app with characters and episodes, where each page fetches its own data.

Built with [React Router](https://reactrouter.com).

## How it works

- `src/services/characters/queries.ts`, `src/services/episodes/queries.ts`, and `src/services/locations/queries.ts` define `charactersQueries`, `episodesQueries`, and `locationsQueries` with `queryOptions`, each keyed under its own domain and fetching from the Rick and Morty API.
- `src/Layout.tsx` maps the React Router routes to `src/Episodes.tsx`, `src/Episode.tsx`, `src/Characters.tsx`, and `src/Character.tsx`, and each page calls `useQuery` with the `list()` or `detail(id)` options it needs.
- `src/Character.tsx` renders an `Episode` and a `Location` component that each call `useQuery` with their own detail options, and `src/Episode.tsx` does the same for each character. A character or episode opened from one page is already cached when the other page needs it.

To run this example:

- `npm install`
- `npm run dev`
