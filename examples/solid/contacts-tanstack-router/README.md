# TanStack Solid Query Contacts Example (TanStack Router)

A contacts app whose router loaders read from the query cache and whose mutations invalidate it.

Built with [TanStack Router](https://tanstack.com/router).

## How it works

- `src/services/contacts/queries.ts` defines `contactsQueries.list(q)` and `contactsQueries.detail(id)` with `queryOptions`, plus `contactsMutations.create()`, `update()` and `delete()` with `mutationOptions`. The detail `queryFn` throws TanStack Router's `notFound()` when the contact does not exist.
- `src/services/contacts/api.ts` stores the contacts in `localStorage` behind a random fake network delay. `src/index.tsx` creates the `QueryClient` with a 10-second `staleTime` and passes it to the router as `context`.
- The route `loader`s in `src/routes/__root.tsx` and `src/routes/contacts.$contactId.route.tsx` call `queryClient.query(...)` with `staleTime: 'static'`, so navigation waits for cached data without refetching it. The components read the same options with `useQuery`.
- `src/routes/__root.tsx` debounces the search input into the `q` search param with `createDebouncer` from TanStack Pacer and shows a spinner while `useIsFetching` counts a fetching list query.
- `src/routes/contacts.new.tsx`, `src/routes/contacts.$contactId.edit.tsx` and `src/routes/contacts.$contactId.index.tsx` run the mutations with `useMutation` and call `queryClient.invalidateQueries` afterwards. The favorite button shows the new value from the pending mutation's `variables`.

To run this example:

- `npm install`
- `npm run dev`
