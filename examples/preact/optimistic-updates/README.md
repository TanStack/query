# TanStack Preact Query Optimistic Updates Example

Adds todos optimistically in two ways: from the pending mutation's `variables`, or by writing to the cache in `onMutate` and rolling back on error.

## How it works

- `src/services/todos/queries.ts` defines `todosQueries.list()`, a `queryOptions` factory keyed by `['todos', 'list']`, and `todosMutations.create()` with `mutationOptions`.
- `src/components/TodoListUI.tsx` reads the list with `useSuspenseQuery` and renders the pending todo from `addTodoMutation.variables` while `isPending` is `true`, without touching the cache. `onSettled` invalidates the list.
- `src/components/TodoListCache.tsx` uses `onMutate` to call `cancelQueries`, save the current list with `getQueryData`, and add a todo with an `optimistic-` id through `setQueryData`. `onError` restores the saved list, and `onSettled` invalidates it.
- `src/components/ApproachTabs.tsx` switches between the two approaches, and `src/App.tsx` wraps them in `Suspense`.
- `src/mocks.ts` is an MSW handler for `/api/todos`. The POST handler fails about 30% of the time with a 500 so the rollback can be seen.

To run this example:

- `npm install`
- `npm run dev`
