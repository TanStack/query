# TanStack React Query Contacts Example (TanStack Router)

A contacts app whose router loaders read from the query cache and whose mutations invalidate it.

Built with [TanStack Router](https://tanstack.com/router).

## How it works

- `src/services/contacts/queries.ts` defines `contactsQueries.list(q)` and `contactsQueries.detail(id)` with `queryOptions`, and `contactsMutations.create()`, `update()`, and `delete()` with `mutationOptions`. The detail `queryFn` throws TanStack Router's `notFound()` when the contact does not exist. `src/services/contacts/api.ts` stores the contacts in `localStorage` behind a random delay.
- The loaders in `src/routes/__root.tsx` (with `loaderDeps` on the `q` search param) and `src/routes/contacts.$contactId.route.tsx` call `queryClient.query({ ...options, staleTime: 'static' })` with the `queryClient` from the router context, which uses cached data when it exists and fetches only on a cache miss. Components read the same options with `useSuspenseQuery`, After the 10-second `staleTime` set in `src/index.tsx`, the data is stale, and `useSuspenseQuery` refetches it in the background on the next trigger, such as a component mount or window focus.
- `src/index.tsx` creates the router with `defaultPreload: 'intent'`, so hovering a contact link runs its loader ahead of time.
- `src/routes/__root.tsx` debounces the search input with `useDebouncedCallback` from TanStack Pacer and shows a spinner while `useIsFetching({ queryKey: contactsQueries.lists() })` is greater than 0.
- `src/routes/contacts.new.tsx`, `src/routes/contacts.$contactId.edit.tsx`, and `src/routes/contacts.$contactId.index.tsx` run the mutations with `useMutation` and call `queryClient.invalidateQueries` afterward. The favorite button shows the pending value from `updateContact.variables` while the mutation `isPending`.

To run this example:

- `npm install`
- `npm run dev`
