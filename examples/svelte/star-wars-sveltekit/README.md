# TanStack Svelte Query Star Wars Example (SvelteKit)

A multi-page Star Wars app with films and characters, where each page fetches its own data.

Built with [SvelteKit](https://svelte.dev/docs/kit).

## How it works

- `src/lib/services/characters/queries.ts`, `src/lib/services/films/queries.ts` and `src/lib/services/planets/queries.ts` define `list()` and `detail(id)` factories with `queryOptions`, keyed by `['characters', ...]`, `['films', ...]` and `['planets', ...]`. The matching `api.ts` files fetch from SWAPI.
- `src/routes/+layout.svelte` creates the `QueryClient` with `enabled: browser`, so queries only run in the browser.
- Each SvelteKit page reads its own data with `createQuery`: `src/routes/characters/+page.svelte` and `src/routes/films/+page.svelte` read the lists, `src/routes/characters/[characterId]/+page.svelte` and `src/routes/films/[filmId]/+page.svelte` read a detail.
- The detail pages render `src/routes/characters/[characterId]/Film.svelte`, `src/routes/characters/[characterId]/Homeworld.svelte` and `src/routes/films/[filmId]/Character.svelte`, each with its own `createQuery` per related id. Details you have already opened come from the cache when you navigate back.

To run this example:

- `npm install`
- `npm run dev`
