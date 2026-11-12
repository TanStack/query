# TanStack Solid Query Contacts Example (Solid Router)

A contacts app whose router loaders read from the query cache and whose mutations invalidate it.

Built with [Solid Router](https://docs.solidjs.com/solid-router).

## How it works

- `src/services/contacts/queries.ts` defines `contactsQueries.list(q)` and `contactsQueries.detail(id)` with `queryOptions`, keyed by `['contacts', 'list', { q }]` and `['contacts', 'detail', id]`. The detail `queryFn` throws "Not Found" when the contact does not exist.
- `src/services/contacts/api.ts` stores the contacts in `localStorage` behind a random fake network delay. `src/queryClient.ts` creates the shared `QueryClient` with a 10-second `staleTime`.
- `src/index.tsx` registers each route's `preload` function. `src/routes/root.tsx` and `src/routes/contact.tsx` start the fetch there with `queryClient.query(...)`, and the components read the same options with `useQuery`.
- `src/routes/root.tsx` debounces the search input into the `q` search param with `createDebouncer` from TanStack Pacer and shows a spinner while `useIsFetching` counts a fetching list query.
- The Solid Router actions in `src/routes/new.tsx`, `src/routes/edit.tsx`, `src/routes/destroy.tsx` and `src/routes/contact.tsx` update `localStorage` and then call `queryClient.invalidateQueries` before redirecting.

To run this example:

- `npm install`
- `npm run dev`
