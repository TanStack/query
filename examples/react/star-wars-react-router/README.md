# TanStack React Query Star Wars Example

A multi-page Star Wars app with films and characters, where each page fetches its own data.

Built with [React Router](https://reactrouter.com).

## How it works

- `src/services/films/queries.ts`, `src/services/characters/queries.ts`, and `src/services/planets/queries.ts` define `filmsQueries`, `charactersQueries`, and `planetsQueries` with `queryOptions`, each keyed under its own domain and fetching from SWAPI. `filmsQueries.detail(filmId)` uses `skipToken` when `filmId` is `undefined`.
- `src/Layout.tsx` maps the React Router routes to `src/Films.tsx`, `src/Film.tsx`, `src/Characters.tsx`, and `src/Character.tsx`, and each page calls `useQuery` with the `list()` or `detail(id)` options it needs.
- `src/Character.tsx` renders a `Film` and a `Homeworld` component that each call `useQuery` with their own detail options, and `src/Film.tsx` does the same for each character. A character or film loaded on one page is already cached when the other page needs it.

To run this example:

- `npm install`
- `npm run dev`
