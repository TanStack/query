# TanStack Vue Query Load-More Infinite Scroll Example (Nuxt 4)

An infinite list that loads the next page when a "Load more" button is clicked or when the end of the list scrolls into view.

Built with [Nuxt 4](https://nuxt.com).

## How it works

- `app/services/projects/queries.ts` defines `projectsQueries.infinite()`, an `infiniteQueryOptions` factory with `initialPageParam: 0` and `getPreviousPageParam` and `getNextPageParam` reading the page's `previousId` and `nextId`.
- `app/pages/index.vue` reads it with `useInfiniteQuery` and renders every page in `data.pages`. The "Load Newer" button calls `fetchNextPage`, and "Load Older" calls `fetchPreviousPage`.
- In `app/pages/index.vue`, `useElementVisibility` from `@vueuse/core` watches the "Load Newer" button, and a `watchEffect` calls `fetchNextPage` when the button is visible, `hasNextPage` is `true` and no next page is being fetched.
- `app/plugins/vue-query.ts` is a Nuxt plugin that creates a `QueryClient` and installs `VueQueryPlugin`. On the server it stores `dehydrate(queryClient)` in `useState('vue-query')` on `app:rendered`, and on the client it calls `hydrate` with that state on `app:created`.
- `server/api/projects.ts` is a Nitro handler that returns 5 projects per cursor after 1 second, with `nextId` and `previousId` set to `null` past cursor 10 and -10.

To run this example:

- `npm install`
- `npm run dev`
