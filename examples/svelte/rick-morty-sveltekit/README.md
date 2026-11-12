# TanStack Svelte Query Rick And Morty Example

A multi-page Rick and Morty app with characters and episodes, where each page fetches its own data.

Built with [SvelteKit](https://svelte.dev/docs/kit).

## How it works

- `src/lib/services/characters/queries.ts`, `src/lib/services/episodes/queries.ts` and `src/lib/services/locations/queries.ts` define `list()` and `detail(id)` factories with `queryOptions`, keyed by `['characters', ...]`, `['episodes', ...]` and `['locations', ...]`. The matching `api.ts` files fetch from the Rick and Morty API.
- `src/routes/+layout.svelte` creates the `QueryClient` with `enabled: browser`, so queries only run in the browser.
- Each SvelteKit page reads its own data with `createQuery`: `src/routes/characters/+page.svelte` and `src/routes/episodes/+page.svelte` read the lists, `src/routes/characters/[characterId]/+page.svelte` and `src/routes/episodes/[episodeId]/+page.svelte` read a detail.
- The detail pages render `src/routes/characters/[characterId]/Episode.svelte`, `src/routes/characters/[characterId]/Location.svelte` and `src/routes/episodes/[episodeId]/Character.svelte`, each with its own `createQuery` per related id. Details you have already opened come from the cache when you navigate back.

To run this example:

- `npm install`
- `npm run dev`
