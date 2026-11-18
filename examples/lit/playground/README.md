# TanStack Lit Query Playground Example

A todo list with adjustable `staleTime`, `gcTime` and error rate, to see how queries and mutations react to them.

## How it works

- `src/services/todos/queries.ts` defines `todosQueries.list(filter)` keyed by `['todos', 'list', { filter }]` and `todosQueries.detail(id)` with `queryOptions`, and `todosMutations.create()` and `todosMutations.update()` with `mutationOptions`.
- `src/services/todos/api.ts` is an in-memory todo server with a random delay and error rate set by `serverConfig`. `getTodos` receives the query's `signal` and logs when a request is cancelled.
- `src/main.ts` calls `queryClient.setDefaultOptions` in `willUpdate` when the `staleTime` or `gcTime` inputs change, and writes the error rate and fetch times into `serverConfig`. "Force Refetch All" calls `queryClient.invalidateQueries()`.
- `src/todo-list.ts` and `src/edit-todo.ts` call `createQueryController` and show `failureCount` while retrying. Saving in `src/edit-todo.ts` or adding in `src/add-todo.ts` with `createMutationController` invalidates `todosQueries.lists()`, and saving also writes the result with `setQueryData`.

To run this example:

- `npm install`
- `npm run dev`
