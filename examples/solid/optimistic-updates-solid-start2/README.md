# TanStack Solid Query Optimistic Updates Example (SolidStart)

Adds todos optimistically in two ways: from the pending mutation's `variables`, or by writing to the cache in `onMutate` and rolling back on error.

Built with [SolidStart](https://start.solidjs.com).

## How it works

- `src/services/todos/queries.ts` defines `todosQueries.list()` with `queryOptions`, keyed by `['todos', 'list']`, and `todosMutations.create()` with `mutationOptions`.
- `src/services/todos/api.ts` keeps the todos in server memory behind SolidStart server functions marked with `'use server'`. `createTodo` waits 500 ms and fails about 30% of the time.
- `src/components/TodoListUI.tsx` renders the pending todo from `addTodoMutation.variables` while `isPending` is `true` and leaves the cache alone. `onSettled` invalidates the list.
- `src/components/TodoListCache.tsx` cancels the list query and writes an optimistic todo into the cache with `queryClient.setQueryData` in `onMutate`, restores the snapshot in `onError`, and invalidates the list in `onSettled`.
- `src/components/ApproachTabs.tsx` switches between the two approaches, and `src/routes/index.tsx` wraps them in `<Suspense>` and an `ErrorBoundary`.

To run this example:

- `npm install`
- `npm run dev`
