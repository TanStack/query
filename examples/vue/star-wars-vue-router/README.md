# TanStack Vue Query Star Wars Example (Vue Router)

A multi-page Star Wars app with films and characters, where each page fetches its own data.

Built with [Vue Router](https://router.vuejs.org).

## How it works

- `src/services/films/queries.ts`, `src/services/characters/queries.ts` and `src/services/planets/queries.ts` define `queryOptions` factories for SWAPI, keyed like `['films', 'detail', filmId]`. `filmsQueries.detail` uses `skipToken` when there is no `filmId`.
- `src/router.ts` maps each Vue Router route to a component and passes route params as props with `props: true`.
- `src/FilmList.vue` and `src/CharacterList.vue` call `useQuery` with a list factory, and `src/FilmDetail.vue` and `src/CharacterDetail.vue` pass a getter such as `useQuery(() => filmsQueries.detail(props.filmId))` so the query follows the route param.
- Detail pages render child components that each run their own `useQuery`: `src/FilmCharacter.vue` per character, `src/CharacterFilm.vue` per film, and `src/CharacterHomeworld.vue` for the character's homeworld. A film or character already loaded on one page comes from the cache on the next.

To run this example:

- `npm install`
- `npm run dev`
