# TanStack Svelte Query Optimistic Updates Example (SvelteKit)

Adds todos optimistically by writing to the cache in `onMutate` and rolling back on error.

Built with [SvelteKit](https://svelte.dev/docs/kit).

## How it works

- `src/lib/services/todos/queries.ts` defines `todosQueries.list()` with `queryOptions`, keyed by `['todos', 'list']`, and `todosMutations.create()` with `mutationOptions`. `src/lib/services/todos/api.ts` calls `/api/data`.
- `src/routes/+page.svelte` reads the list with `createQuery` and adds todos with `createMutation`. In `onMutate` it cancels the list query, saves the current data and writes the new todo into the cache with `client.setQueryData`.
- If the mutation fails, `onError` restores the saved data. `onSettled` invalidates the list either way, so it is refetched from the server.
- `src/routes/api/data/+server.ts` is a SvelteKit endpoint that keeps the todos in server memory. `GET` waits 1 second, and `POST` uppercases the text and fails about 30% of the time.

To run this example:

- `npm install`
- `npm run dev`
