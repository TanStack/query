# TanStack Solid Query Prefetching Example (SolidStart)

Prefetches a character when you hover its link, so the detail view opens without a loading state.

Built with [SolidStart](https://start.solidjs.com).

## How it works

- `src/services/characters/queries.ts` defines `charactersQueries.list()` and `charactersQueries.detail(id)` with `queryOptions`. The detail options use `skipToken` when there is no `id`.
- `src/services/characters/api.ts` fetches characters from the Rick and Morty API after a 500 ms delay.
- In `src/routes/index.tsx`, each `CharacterItem` calls `queryClient.query(...)` with a 10-second `staleTime` on `mouseenter` and `focusin`, so a character is fetched again only when its cached data is older than that. A `useQuery` with `enabled: false` only observes the cache and turns the name bold once the data is there.
- `src/routes/character/[id].tsx` reads the same `charactersQueries.detail(id)` with `useQuery`, so a prefetched character renders without a loading state.

To run this example:

- `npm install`
- `npm run dev`
