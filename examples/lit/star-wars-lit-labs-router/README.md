# TanStack Lit Query Star Wars Example (@lit-labs/router)

A multi-page Star Wars app with films and characters, where each page fetches its own data.

Built with [`@lit-labs/router`](https://www.npmjs.com/package/@lit-labs/router).

## How it works

- `src/services/films/queries.ts`, `src/services/characters/queries.ts`, and `src/services/planets/queries.ts` define `queryOptions` factories (`filmsQueries`, `charactersQueries`, `planetsQueries`) for the Star Wars API. `filmsQueries.detail` uses `skipToken` when there is no film id.
- `src/app-layout.ts` defines the `@lit-labs/router` routes, and `src/film-list.ts` and `src/character-list.ts` load their lists with `createQueryController`.
- `src/character-detail.ts` loads one character, then renders `<character-film>` (`src/character-film.ts`) and `<character-homeworld>` (`src/character-homeworld.ts`) elements that each call `createQueryController` with their own detail query. `src/film-detail.ts` does the same for the film's characters with `src/film-character.ts`, so a character seen on one page is already cached when it shows up on another.

To run this example:

- `npm install`
- `npm run dev`
