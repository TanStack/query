# TanStack Solid Query Star Wars Example

A multi-page Star Wars app with films and characters, where each page fetches its own data.

Built with [Solid Router](https://docs.solidjs.com/solid-router).

## How it works

- `src/services/characters/queries.ts`, `src/services/films/queries.ts` and `src/services/planets/queries.ts` define `list()` and `detail(id)` factories with `queryOptions`, keyed by `['characters', ...]`, `['films', ...]` and `['planets', ...]`. The matching `api.ts` files fetch from SWAPI.
- `src/App.tsx` maps each Solid Router route to a page component, and each page reads its own data with `useQuery`: `src/Characters.tsx` and `src/Films.tsx` read the lists, `src/Character.tsx` and `src/Film.tsx` read a detail.
- `src/Character.tsx` renders a `Film` and a `Homeworld` component per related id, each with its own `useQuery`, and `src/Film.tsx` does the same for characters. Details you have already opened come from the cache when you navigate back.

To run this example:

- `npm install`
- `npm run dev`
