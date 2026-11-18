# TanStack Svelte Query Batching Example

Several components request characters at the same time, and an async batcher from TanStack Pacer combines those requests into one.

## How it works

- `src/lib/services/characters/queries.ts` defines `charactersQueries.detail(id)` with `queryOptions`, keyed by `['characters', 'detail', id]` with a 1-minute `staleTime`.
- `src/lib/services/characters/api.ts` adds each `getCharacter(id)` call to an `AsyncBatcher` from TanStack Pacer with `wait: 0`. The batcher sends one Rick and Morty API request for all collected ids and resolves each query's promise with its own character.
- `src/lib/Characters.svelte` passes one `charactersQueries.detail(id)` per id to `createQueries`, so each character is still a separate query in the cache even though the network request is shared.
- `src/App.svelte` parses the comma-separated ids and passes them to `Characters` when "Load characters" is clicked.

To run this example:

- `npm install`
- `npm run dev`
