# TanStack Vue Query Rick And Morty Example

A multi-page Rick and Morty app with characters and episodes, where each page fetches its own data.

Built with [Vue Router](https://router.vuejs.org).

## How it works

- `src/services/characters/queries.ts`, `src/services/episodes/queries.ts` and `src/services/locations/queries.ts` define `queryOptions` factories for the Rick and Morty API, keyed like `['characters', 'detail', characterId]`.
- `src/router.ts` maps each Vue Router route to a component and passes route params as props with `props: true`.
- `src/EpisodeList.vue` and `src/CharacterList.vue` call `useQuery` with a list factory, and `src/EpisodeDetail.vue` and `src/CharacterDetail.vue` pass a getter such as `useQuery(() => episodesQueries.detail(props.episodeId))` so the query follows the route param.
- Detail pages render child components that each run their own `useQuery`: `src/EpisodeCharacter.vue` per character, `src/CharacterEpisode.vue` per episode, and `src/LocationDetail.vue` for the character's location. A character already loaded on one page comes from the cache on the next.

To run this example:

- `npm install`
- `npm run dev`
