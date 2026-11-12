# TanStack Preact Query Prefetching Example

Prefetches a character when you hover its link, so the detail view opens without a loading state.

Built with [preact-iso](https://github.com/preactjs/preact-iso).

## How it works

- `src/services/characters/queries.ts` defines `charactersQueries.list()` and `charactersQueries.detail(id)` with `queryOptions`. `detail` uses `skipToken` when `id` is `undefined`.
- In `src/Home.tsx`, each `CharacterItem` calls `queryClient.query({ ...charactersQueries.detail(char.id), staleTime: 10 * 1000 })` on mouse enter or focus. It also subscribes with `useQuery` and `enabled: false`, so the name turns bold once the character is cached.
- `src/Character.tsx` is the `/character/:id` route from `src/App.tsx` (`preact-iso`). It reads the id with `useRoute` and calls `useQuery(charactersQueries.detail(...))`, which renders without a loading state when the character was prefetched.

To run this example:

- `npm install`
- `npm run dev`
