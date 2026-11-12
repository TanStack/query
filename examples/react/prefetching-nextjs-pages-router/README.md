# TanStack React Query Prefetching Example

Prefetches a character when you hover its link, so the detail view opens without a loading state.

Built with [Next.js (Pages Router)](https://nextjs.org/docs/pages).

## How it works

- `src/services/characters/queries.ts` defines `charactersQueries.list()` and `charactersQueries.detail(id)` with `queryOptions`. The detail `queryFn` is `skipToken` when `id` is `undefined`. `src/services/characters/api.ts` waits 500 ms before each request to the Rick and Morty API.
- In `src/pages/index.tsx`, each `CharacterItem` calls `queryClient.query({ ...charactersQueries.detail(char.id), staleTime: 10 * 1000 })` on `onMouseEnter` and `onFocus`, so a character is fetched only if it is missing or older than 10 seconds. It also observes the detail with `useQuery` and `enabled: false` to bold characters that are already cached.
- The selected character in `src/pages/index.tsx` is read with `useQuery(charactersQueries.detail(selectedChar))`, so clicking a prefetched character shows it immediately.
- `src/pages/character/[id].tsx` reads the same detail options with `useQuery`, passing `undefined` for an invalid id, and renders prefetched characters without a loading state.

To run this example:

- `npm install`
- `npm run dev`
