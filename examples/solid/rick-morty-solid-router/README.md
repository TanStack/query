# TanStack Solid Query Rick And Morty Example

A multi-page Rick and Morty app with characters and episodes, where each page fetches its own data.

Built with [Solid Router](https://docs.solidjs.com/solid-router).

## How it works

- `src/services/characters/queries.ts`, `src/services/episodes/queries.ts` and `src/services/locations/queries.ts` define `list()` and `detail(id)` factories with `queryOptions`, keyed by `['characters', ...]`, `['episodes', ...]` and `['locations', ...]`. The matching `api.ts` files fetch from the Rick and Morty API.
- `src/App.tsx` maps each Solid Router route to a page component, and each page reads its own data with `useQuery`: `src/Characters.tsx` and `src/Episodes.tsx` read the lists, `src/Character.tsx` and `src/Episode.tsx` read a detail.
- `src/Character.tsx` renders an `Episode` and a `Location` component per related id, each with its own `useQuery`, and `src/Episode.tsx` does the same for characters. Details you have already opened come from the cache when you navigate back.

To run this example:

- `npm install`
- `npm run dev`
