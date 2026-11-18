# TanStack Lit Query Auto Refetching Example

A todo list that polls the server with `refetchInterval`. Adding a todo or clearing the list invalidates the query.

## How it works

- `src/services/todos/queries.ts` defines `todosQueries.list()`, a `queryOptions` factory keyed by `['todos', 'list']`, and `todosMutations.create()` and `todosMutations.deleteAll()` with `mutationOptions`.
- `src/main.ts` passes the list query to `createQueryController` with `refetchInterval` set from the interval input (1000 ms by default), and shows a dot while `isFetching` is `true`.
- Both mutations run through `createMutationController` and call `client.invalidateQueries({ queryKey: todosQueries.all() })` in `onSuccess`, using the `client` from the mutation function context.
- `src/mocks.ts` is an MSW handler for `/api/data` that adds or clears items in a list stored in `localStorage`, so changes show up in other tabs on the next refetch.

To run this example:

- `npm install`
- `npm run dev`
