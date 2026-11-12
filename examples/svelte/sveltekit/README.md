# TanStack Svelte Query Contacts Example (SvelteKit)

A contacts app whose SvelteKit `load` functions read from the query cache and whose mutations invalidate it.

Built with [SvelteKit](https://svelte.dev/docs/kit).

## How it works

- `src/lib/services/contacts/queries.ts` defines `contactsQueries.list(query, customFetch)` and `contactsQueries.detail(id, customFetch)` with `queryOptions`. `src/lib/services/contacts/api.ts` calls the `/api/contacts` endpoints with SvelteKit's `fetch` when a `load` function passes it.
- `src/routes/+layout.ts` creates the `QueryClient` in a `load` function with a 10-second `staleTime` and `enabled: browser`, and `src/routes/+layout.svelte` provides it with `QueryClientProvider`.
- `src/routes/(app)/+layout.ts`, `src/routes/(app)/contacts/[contactId]/+page.ts` and `src/routes/(app)/contacts/[contactId]/edit/+page.ts` fill the cache in their `load` functions with `queryClient.query(...)` and `staleTime: 'static'`, and the pages read the same options with `createQuery`.
- `src/routes/(app)/+layout.svelte` submits the search form through `createDebouncer` from TanStack Pacer and shows a spinner while `useIsFetching` counts a fetching list query.
- The form actions in the `+page.server.ts` files change the contacts in `src/lib/server/contacts.ts`. `src/lib/ContactForm.svelte` and `src/routes/(app)/contacts/[contactId]/+page.svelte` use `enhance` to call `queryClient.invalidateQueries` after each submission.

To run this example:

- `npm install`
- `npm run dev`
