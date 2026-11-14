# TanStack Solid Query Playground Example

A todo list with adjustable `staleTime`, `gcTime` and error rate, to see how queries and mutations react to them.

## How it works

- `src/services/todos/queries.ts` defines `todosQueries.list(filter)` and `todosQueries.detail(id)` with `queryOptions`, keyed under `['todos', 'list']` and `['todos', 'detail', id]`, and `todosMutations.create()` and `update()` with `mutationOptions`.
- `src/services/todos/api.ts` simulates a server in memory. Every call waits a random time between `serverConfig.queryTimeMin` and `serverConfig.queryTimeMax` and fails at `serverConfig.errorRate`.
- `src/index.tsx` binds the inputs to `serverConfig` and calls `queryClient.setDefaultOptions` with the chosen `staleTime` and `gcTime` from a `createEffect`. Each filter list reads its todos with `useQuery`, and "Force Refetch All" calls `queryClient.invalidateQueries()`.
- The `EditTodo` and `AddTodo` components in `src/index.tsx` run the mutations with `useMutation`. On success they invalidate `todosQueries.lists()`, and saving an edit also writes the result into the detail query with `queryClient.setQueryData`.

To run this example:

- `npm install`
- `npm run dev`
