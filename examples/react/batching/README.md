# TanStack React Query Batching Example

Several components request characters at the same time, and an async batcher from TanStack Pacer combines those requests into one.

## How it works

- `src/services/characters/queries.ts` defines `charactersQueries.detail(id)` with `queryOptions`, keyed by `['characters', 'detail', id]` with a `staleTime` of 1 minute.
- `src/services/characters/api.ts` has `getCharacter(id)` add a request to an `AsyncBatcher` from TanStack Pacer and return a deferred promise. With `wait: 0`, the requests collected in the same tick are sent as one call to `/api/character/[ids]`, and each promise resolves with its own character or `null`.
- `src/index.tsx` passes the entered ids to `useQueries` with `ids.map((id) => charactersQueries.detail(id))`, so each id is its own query while the network sees a single request.

To run this example:

- `npm install`
- `npm run dev`
