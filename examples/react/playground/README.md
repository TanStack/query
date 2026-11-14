# TanStack React Query Playground Example

A todo list with adjustable `staleTime`, `gcTime` and error rate, to see how queries and mutations react to them.

## How it works

- `src/services/todos/queries.ts` defines `todosQueries.list(filter)`, keyed by `['todos', 'list', { filter }]` and passing the query `signal` to the API, and `todosQueries.detail(id)` with `queryOptions`, plus `todosMutations.create()` and `todosMutations.update()` with `mutationOptions`.
- `src/services/todos/api.ts` keeps the todos in memory, responds after a random delay between `serverConfig.queryTimeMin` and `serverConfig.queryTimeMax`, and rejects at the rate set in `serverConfig.errorRate`.
- In `src/index.tsx`, the inputs in `Root` update `serverConfig` and call `queryClient.setDefaultOptions` with the chosen `staleTime` and `gcTime`. Each `Todos` list runs `useQuery(todosQueries.list(filter))` with its own filter and shows `failureCount` while retrying, and "Force Refetch All" calls `queryClient.invalidateQueries()`.
- `EditTodo` and `AddTodo` in `src/index.tsx` run the mutations with `useMutation` and invalidate `todosQueries.lists()` on success. `EditTodo` also writes the saved todo into its detail query with `queryClient.setQueryData`.

To run this example:

- `npm install`
- `npm run dev`
