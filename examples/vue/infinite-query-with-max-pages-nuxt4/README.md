# TanStack Vue Query Infinite Query With Max Pages Example

An infinite list that loads pages in both directions and keeps at most 3 pages in the cache with `maxPages`.

Built with [Nuxt 4](https://nuxt.com).

## How it works

- `app/services/projects/queries.ts` defines `projectsQueries.infinite()`, an `infiniteQueryOptions` factory with `initialPageParam: 0`, `getPreviousPageParam` and `getNextPageParam` reading the page's `previousId` and `nextId`, and `maxPages: 3`.
- `app/app.vue` reads it with `useInfiniteQuery` and renders every page in `data.pages`. "Load Older" calls `fetchPreviousPage` and "Load Newer" calls `fetchNextPage`; with `maxPages: 3`, loading a fourth page drops the page at the other end.
- `app/plugins/vue-query.ts` is a Nuxt plugin that creates a `QueryClient` and installs `VueQueryPlugin`. On the server it stores `dehydrate(queryClient)` in `useState('vue-query')` on `app:rendered`, and on the client it calls `hydrate` with that state on `app:created`.
- `server/api/projects.ts` is a Nitro handler that returns 4 projects per cursor after 300 ms, with `nextId` and `previousId` set to `null` past cursor 20 and -20.

To run this example:

- `npm install`
- `npm run dev`
