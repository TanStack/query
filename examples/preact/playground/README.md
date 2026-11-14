# TanStack Preact Query Playground Example

A todo list with adjustable `staleTime`, `gcTime` and error rate, to see how queries and mutations react to them.

## How it works

- `src/services/todos/queries.ts` defines `todosQueries.list(filter)` keyed by `['todos', 'list', { filter }]` and `todosQueries.detail(id)` with `queryOptions`, and `todosMutations.create()` and `todosMutations.update()` with `mutationOptions`.
- `src/services/todos/api.ts` is an in-memory todo server with a random delay and error rate set by `serverConfig`. `getTodos` receives the query's `signal` and logs when a request is cancelled.
- In `src/index.tsx`, `Root` calls `queryClient.setDefaultOptions` whenever the `staleTime` or `gcTime` inputs change, and writes the error rate and fetch times into `serverConfig`.
- `Todos` and `EditTodo` in `src/index.tsx` call `useQuery` and show `failureCount` while retrying. Saving or adding a todo with `useMutation` invalidates `todosQueries.lists()`, and saving also writes the result with `setQueryData`. "Force Refetch All" calls `queryClient.invalidateQueries()`.

To run this example:

- `npm install`
- `npm run dev`
