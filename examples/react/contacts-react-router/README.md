# TanStack React Query Contacts Example (React Router)

A contacts app whose router loaders read from the query cache and whose mutations invalidate it.

Built with [React Router](https://reactrouter.com).

## How it works

- `src/services/contacts/queries.ts` defines `contactsQueries.list(q)` and `contactsQueries.detail(id)` with `queryOptions`, keyed under `['contacts', 'list']` and `['contacts', 'detail']`. The detail `queryFn` throws a 404 `Response` when the contact does not exist. `src/services/contacts/api.ts` stores the contacts in `localStorage` behind a random delay.
- The loaders in `src/routes/root.tsx` and `src/routes/contact.tsx` await `queryClient.query({ ...options, staleTime: 'static' })`, which uses cached data when it exists and fetches only on a cache miss. The route components then read the same options with `useSuspenseQuery`, which refetches in the background once the `staleTime` of 10 seconds set on the `QueryClient` in `src/index.tsx` has passed.
- `src/routes/root.tsx` debounces the search input with `useDebouncedCallback` from TanStack Pacer and shows a spinner while `useIsFetching({ queryKey: contactsQueries.lists() })` is greater than 0.
- The route actions in `src/routes/new.tsx`, `src/routes/edit.tsx`, `src/routes/contact.tsx`, and `src/routes/destroy.tsx` call the API, then `queryClient.invalidateQueries` so the list and detail refetch.

To run this example:

- `npm install`
- `npm run dev`
