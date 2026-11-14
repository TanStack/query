# TanStack Lit Query Optimistic Updates Example

Adds todos optimistically in two ways: from the pending mutation's `variables`, or by writing to the cache in `onMutate` and rolling back on error.

## How it works

- `src/services/todos/queries.ts` defines `todosQueries.list()`, a `queryOptions` factory keyed by `['todos', 'list']`, and `todosMutations.create()` with `mutationOptions`.
- `src/todo-list-ui.ts` reads the list with `createQueryController` and renders the pending todo from the mutation's `variables` while `isPending` is `true`, without touching the cache. `onSettled` invalidates the list.
- `src/todo-list-cache.ts` uses `onMutate` on its `createMutationController` to call `cancelQueries`, save the current list with `getQueryData`, and add a todo with an `optimistic-` id through `setQueryData`. `onError` restores the saved list, and `onSettled` invalidates it.
- `src/approach-tabs.ts` switches between the two elements.
- `src/mocks.ts` is an MSW handler for `/api/todos`. The POST handler fails about 30% of the time with a 500 so the rollback can be seen.

To run this example:

- `npm install`
- `npm run dev`
