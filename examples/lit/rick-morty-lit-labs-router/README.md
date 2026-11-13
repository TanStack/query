# TanStack Lit Query Rick And Morty Example (@lit-labs/router)

A multi-page Rick and Morty app with characters and episodes, where each page fetches its own data.

Built with [`@lit-labs/router`](https://www.npmjs.com/package/@lit-labs/router).

## How it works

- `src/services/characters/queries.ts`, `src/services/episodes/queries.ts`, and `src/services/locations/queries.ts` define `queryOptions` factories (`charactersQueries`, `episodesQueries`, `locationsQueries`) for the Rick and Morty API, each keyed by its domain plus `'list'` or `'detail'` and an id.
- `src/app-layout.ts` defines the `@lit-labs/router` routes, and `src/character-list.ts` and `src/episode-list.ts` load their lists with `createQueryController`.
- `src/character-detail.ts` loads one character, then renders `<character-episode>` (`src/character-episode.ts`) and `<location-detail>` (`src/location-detail.ts`) elements that each call `createQueryController` with their own detail query. `src/episode-detail.ts` does the same for the episode's characters with `src/episode-character.ts`, so a character seen on one page is already cached when it shows up on another.

To run this example:

- `npm install`
- `npm run dev`
