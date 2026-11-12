# TanStack Svelte Query Auto Refetching Example

A todo list that polls the server with `refetchInterval`. Adding a todo or clearing the list invalidates the query.

Built with [SvelteKit](https://svelte.dev/docs/kit).

## How it works

- `src/lib/services/todos/queries.ts` defines `todosQueries.list()` with `queryOptions`, keyed by `['todos', 'list']`, and `todosMutations.create()` and `todosMutations.deleteAll()` with `mutationOptions`. `src/lib/services/todos/api.ts` calls `/api/data`.
- `src/routes/+page.svelte` passes the list options to `createQuery` with `refetchInterval` bound to the interval input, so changing the input changes how often the query refetches. Both mutations call `invalidateQueries` on the list in `onSuccess`.
- `src/routes/+layout.svelte` creates the `QueryClient` with `enabled: browser`, so queries only run in the browser.
- `src/routes/api/data/+server.ts` is a SvelteKit endpoint that keeps the list in server memory and adds or clears items based on the `add` and `clear` search params.

To run this example:

- `npm install`
- `npm run dev`
