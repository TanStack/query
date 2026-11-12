# TanStack Vue Query Prefetching Example (Nuxt 4)

Prefetches a character when you hover its link, so the detail view opens without a loading state.

Built with [Nuxt 4](https://nuxt.com).

## How it works

- `app/services/characters/queries.ts` defines `charactersQueries.list()` and `charactersQueries.detail(id)` with `queryOptions`; the detail uses `skipToken` when there is no `id`. `app/services/characters/api.ts` waits 500 ms before each request to the Rick and Morty API.
- `app/components/CharacterItem.vue` calls `queryClient.query` with `staleTime: 10 * 1000` on `mouseenter` and `focusin`, so a character is prefetched at most once every 10 seconds. It also observes the same query with `enabled: false` and shows the name in bold once data is cached.
- `app/pages/index.vue` lists the characters with `useQuery(charactersQueries.list())` and shows the selected one with a second `useQuery`, which renders at once when the character was prefetched.
- `app/pages/character/[id].vue` reads the character for the route's `id` with `useQuery`, so opening the details of a prefetched character renders without a loading state.
- `app/plugins/vue-query.ts` is a Nuxt plugin that creates a `QueryClient` and installs `VueQueryPlugin`. On the server it stores `dehydrate(queryClient)` in `useState('vue-query')` on `app:rendered`, and on the client it calls `hydrate` with that state on `app:created`.

To run this example:

- `npm install`
- `npm run dev`
