# TanStack Vue Query Contacts Example (Vue Router)

A contacts app whose router loaders read from the query cache and whose mutations invalidate it.

Built with [Vue Router](https://router.vuejs.org).

## How it works

- `src/services/contacts/queries.ts` defines `contactsQueries.list(q)` and `contactsQueries.detail(id)` with `queryOptions`. The detail query throws `Not Found` when the contact does not exist.
- `src/router.ts` runs `queryClient.query` with `staleTime: 'static'` for the list and, on contact routes, the detail in `router.beforeResolve`, so each view renders with data already in the cache. `src/queryClient.ts` creates that shared `QueryClient` with a 10-second `staleTime`, and `src/main.ts` passes it to `VueQueryPlugin`.
- `src/routes/RootView.vue` reads the list with `useQuery` and the `q` search param, debounces typing with `useDebouncer` from `@tanstack/vue-pacer` before updating the URL, and shows a searching state from `useIsFetching`.
- `src/routes/NewView.vue`, `src/routes/EditView.vue`, `src/routes/ContactView.vue` and `src/FavoriteButton.vue` call `useMutation` and invalidate `contactsQueries.lists()` or `contactsQueries.all()` on success. `src/FavoriteButton.vue` shows the pending `variables` as the favorite state until the mutation finishes.
- `src/services/contacts/api.ts` stores contacts in `localStorage` and waits a random time up to 800 ms on each call to simulate the network.

To run this example:

- `npm install`
- `npm run dev`
