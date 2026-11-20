# TanStack Svelte Query Prefetching Example (SvelteKit)

Prefetches a character when you hover its link, so the detail view opens without a loading state.

Built with [SvelteKit](https://svelte.dev/docs/kit).

## How it works

- `src/lib/services/characters/queries.ts` defines `charactersQueries.list()` and `charactersQueries.detail(id)` with `queryOptions`. The detail options use `skipToken` when there is no `id`.
- `src/lib/services/characters/api.ts` fetches characters from the Rick and Morty API after a 500 ms delay.
- `src/lib/CharacterItem.svelte` calls `queryClient.query(...)` with a 10-second `staleTime` on `mouseenter` and `focusin`, so a character is fetched again only when its cached data is older than that. A `createQuery` with `enabled: false` only observes the cache and turns the name bold once the data is there.
- `src/routes/+page.svelte` and `src/routes/character/[id]/+page.svelte` read the same `charactersQueries.detail(id)` with `createQuery`, so a prefetched character renders without a loading state.
- `src/routes/+layout.svelte` creates the `QueryClient` with `enabled: browser`, so queries only run in the browser.

To run this example:

- `npm install`
- `npm run dev`
