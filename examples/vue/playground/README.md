# TanStack Vue Query Playground Example

A todo list with adjustable `staleTime`, `gcTime` and error rate, to see how queries and mutations react to them.

## How it works

- `src/services/todos/api.ts` is an in-memory todo server. Each call waits a random time and fails at a random rate, both read from the exported `serverConfig`.
- `src/services/todos/queries.ts` defines `todosQueries.list(filter)` and `todosQueries.detail(id)` with `queryOptions`, and `todosMutations.create()` and `todosMutations.update()` with `mutationOptions`. The list query passes its `signal` to the API.
- `src/TodoList.vue` passes a getter to `useQuery` that follows the filter input, and shows `failureCount + 1` as the attempt number while loading or refetching. `src/App.vue` renders several of these lists at once.
- `src/AddTodo.vue` and `src/EditTodo.vue` call `useMutation`. On success both invalidate `todosQueries.lists()`, and `src/EditTodo.vue` also writes the saved todo with `queryClient.setQueryData`.
- `src/App.vue` applies the `staleTime` and `gcTime` inputs with `queryClient.setDefaultOptions` inside `watchEffect`, copies the error rate and fetch times into `serverConfig`, and refetches everything with `queryClient.invalidateQueries()`.

To run this example:

- `npm install`
- `npm run dev`
