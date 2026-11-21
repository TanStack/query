# TanStack Preact Query Star Wars Example (preact-iso)

A multi-page Star Wars app with films and characters, where each page fetches its own data.

Built with [preact-iso](https://github.com/preactjs/preact-iso).

## How it works

- `src/services/films/queries.ts`, `src/services/characters/queries.ts`, and `src/services/planets/queries.ts` define `queryOptions` factories (`filmsQueries`, `charactersQueries`, `planetsQueries`) for the Star Wars API. `filmsQueries.detail` uses `skipToken` when there is no film id.
- `src/Layout.tsx` defines the `preact-iso` routes, and `src/Films.tsx` and `src/Characters.tsx` load their lists with `useQuery`.
- `src/Character.tsx` loads one character, then renders a `Film` component per film and a `Homeworld` component that each call `useQuery` with their own detail query. `src/Film.tsx` does the same for the film's characters, so a character seen on one page is already cached when it shows up on another.

To run this example:

- `npm install`
- `npm run dev`
