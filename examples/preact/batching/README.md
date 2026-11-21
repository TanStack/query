# TanStack Preact Query Batching Example

Several components request characters at the same time, and an async batcher from TanStack Pacer combines those requests into one.

## How it works

- `src/services/characters/queries.ts` defines `charactersQueries.detail(id)`, a `queryOptions` factory keyed by `['characters', 'detail', id]` with a 1-minute `staleTime`.
- `src/services/characters/api.ts` does not fetch in `getCharacter`. Instead, it adds the id to an `AsyncBatcher` from `@tanstack/pacer` with `wait: 0`, which sends one request to the Rick and Morty API for all ids queued in the same tick and resolves each query's promise with its character.
- In `src/index.tsx`, `Characters` calls `useQueries` with one `charactersQueries.detail(id)` per entered id, so each id still has its own cache entry and status.

To run this example:

- `npm install`
- `npm run dev`
