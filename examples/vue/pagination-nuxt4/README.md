# TanStack Vue Query Pagination Example (Nuxt 4)

Paginated projects with `placeholderData: keepPreviousData`, so the current page stays visible while the next one loads. The next page is prefetched.

Built with [Nuxt 4](https://nuxt.com).

## How it works

- `app/services/projects/queries.ts` defines `projectsQueries.list(page)`, a `queryOptions` factory keyed by `['projects', 'list', page]` with a 5-second `staleTime`.
- `app/app.vue` passes a getter to `useQuery` with `placeholderData: keepPreviousData`. While the next page loads, `data` still holds the previous page and `isPlaceholderData` is `true`, which disables the "Next Page" button.
- A `watchEffect` in `app/app.vue` fetches the next page ahead of time with `queryClient.query(projectsQueries.list(page.value + 1))` when the current page has `hasMore: true`.
- `app/plugins/vue-query.ts` is a Nuxt plugin that creates a `QueryClient` and installs `VueQueryPlugin`. On the server it stores `dehydrate(queryClient)` in `useState('vue-query')` on `app:rendered`, and on the client it calls `hydrate` with that state on `app:created`.
- `server/api/projects.ts` is a Nitro handler that returns 10 projects per page after a 1-second delay, with `hasMore: page < 9`.

To run this example:

- `npm install`
- `npm run dev`
