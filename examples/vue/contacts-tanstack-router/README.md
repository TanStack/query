# TanStack Vue Query TanStack Router Example

A contacts app whose router loaders read from the query cache and whose mutations invalidate it.

Built with [TanStack Router](https://tanstack.com/router).

## How it works

- `src/services/contacts/queries.ts` defines `contactsQueries.list(q)` and `contactsQueries.detail(id)` with `queryOptions`, and `contactsMutations.create()`, `update()` and `delete()` with `mutationOptions`. The detail query throws TanStack Router's `notFound()` when the contact does not exist.
- `src/router.ts` passes the `queryClient` from `src/queryClient.ts` into the router context with `defaultPreload: 'intent'`. The loaders in `src/routes/__root.ts` and `src/routes/contacts.$contactId.route.ts` call `queryClient.query` with `staleTime: 'static'`, so the list and the contact are in the cache before the route renders.
- `src/routes/__root.component.vue` reads the list with `useQuery(() => contactsQueries.list(q.value))`, debounces typing with `useDebouncer` from `@tanstack/vue-pacer` before updating the `q` search param, and shows a searching state from `useIsFetching`.
- `src/routes/contacts.new.component.vue`, `src/routes/contacts.$contactId.edit.component.vue`, `src/routes/contacts.$contactId.index.component.vue` and `src/FavoriteButton.vue` spread `contactsMutations` into `useMutation` and invalidate `contactsQueries.lists()` or `contactsQueries.all()`. `src/FavoriteButton.vue` shows the pending `variables` as the favorite state until the mutation settles.
- `src/services/contacts/api.ts` stores contacts in `localStorage` and waits a random time up to 800 ms on each call to simulate the network.

To run this example:

- `npm install`
- `npm run dev`
