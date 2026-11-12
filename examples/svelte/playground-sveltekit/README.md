# TanStack Svelte Query Playground Example

A todo list with adjustable `staleTime`, `gcTime` and error rate, to see how queries and mutations react to them.

Built with [SvelteKit](https://svelte.dev/docs/kit).

## How it works

- `src/lib/services/todos/queries.ts` defines `todosQueries.list(filter)` and `todosQueries.detail(id)` with `queryOptions`, keyed under `['todos', 'list']` and `['todos', 'detail', id]`, and `todosMutations.create()` and `update()` with `mutationOptions`.
- `src/lib/services/todos/api.ts` simulates a server in memory. Every call waits a random time between `queryTimeMin` and `queryTimeMax` and fails at `errorRate`, which are reactive values from `src/lib/stores.svelte.ts`.
- `src/routes/+layout.svelte` creates the `QueryClient` with `enabled: browser`, so queries only run in the browser. `src/routes/+page.svelte` binds the inputs to the stores and calls `queryClient.setDefaultOptions` with the chosen `staleTime` and `gcTime` from an `$effect`.
- `src/routes/TodosList.svelte` reads each filtered list with `createQuery`, and "Force Refetch All" in `src/routes/App.svelte` calls `queryClient.invalidateQueries()`.
- `src/routes/AddTodo.svelte` and `src/routes/EditTodo.svelte` run the mutations with `createMutation`. On success they invalidate `todosQueries.lists()`, and saving an edit also writes the result into the detail query with `queryClient.setQueryData`.

To run this example:

- `npm install`
- `npm run dev`
