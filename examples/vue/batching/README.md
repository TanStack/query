# TanStack Vue Query Batching Example

Several components request characters at the same time, and an async batcher from TanStack Pacer combines those requests into one.

## How it works

- `src/services/characters/api.ts` queues each `getCharacter(id)` call in an `AsyncBatcher` from `@tanstack/vue-pacer` with `wait: 0`, so calls made together become one Rick and Morty API request. Each caller gets its own character, or `null` if it was not found.
- `src/services/characters/queries.ts` defines `charactersQueries.detail(id)`, a `queryOptions` factory keyed by `['characters', 'detail', id]` with a 1-minute `staleTime`.
- `src/CharacterList.vue` passes a getter to `useQueries` that maps the `ids` prop to `charactersQueries.detail(id)`, so all character queries start in the same tick and the batcher combines them.
- `src/main.ts` installs `VueQueryPlugin` with `retry: 0` as the default query option.

To run this example:

- `npm install`
- `npm run dev`
