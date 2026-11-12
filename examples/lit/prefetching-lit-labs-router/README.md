# TanStack Lit Query Prefetching Example

Prefetches a character when you hover its link, so the detail view opens without a loading state.

Built with [`@lit-labs/router`](https://www.npmjs.com/package/@lit-labs/router).

## How it works

- `src/services/characters/queries.ts` defines `charactersQueries.list()` and `charactersQueries.detail(id)` with `queryOptions`. `detail` uses `skipToken` when `id` is `undefined`.
- `src/character-item.ts` calls `useQueryClient().query({ ...charactersQueries.detail(this.characterId), staleTime: 10 * 1000 })` on mouse enter or focus. It also subscribes with `createQueryController` and `enabled: false`, so the name turns bold once the character is cached.
- `src/home-view.ts` loads the list and the selected character with `createQueryController`.
- `src/character-view.ts` is the `/character/:id` route from `src/main.ts` (`@lit-labs/router`). Its `createQueryController` for `charactersQueries.detail(...)` renders without a loading state when the character was prefetched.

To run this example:

- `npm install`
- `npm run dev`
