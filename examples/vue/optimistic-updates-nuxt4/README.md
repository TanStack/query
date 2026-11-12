# TanStack Vue Query Optimistic Updates Example

Adds todos optimistically in two ways: from the pending mutation's `variables`, or by writing to the cache in `onMutate` and rolling back on error.

Built with [Nuxt 4](https://nuxt.com).

## How it works

- `app/services/todos/queries.ts` defines `todosQueries.list()` with `queryOptions` and `todosMutations.create()` with `mutationOptions`. `app/services/todos/api.ts` calls the server with `$fetch` and rethrows the server's error message.
- `app/components/TodoListUI.vue` renders the pending todo from the mutation's `variables` while `isPending` is `true`, without touching the cache, and invalidates the list in `onSettled`.
- `app/components/TodoListCache.vue` cancels the list query in `onMutate`, saves the previous list, and adds a temporary todo with `queryClient.setQueryData`. `onError` restores the saved list, and `onSettled` invalidates it.
- `app/app.vue` sets the page head with `useHead` and renders `app/components/ApproachTabs.vue` inside `<Suspense>`, so the tab that awaits `suspense()` shows the fallback until the list loads. `app/plugins/vue-query.ts` creates a `QueryClient` with a 1-minute `staleTime`, dehydrates it into `useState('vue-query')` on the server, and hydrates it on the client.
- `server/api/todos.get.ts` and `server/api/todos.post.ts` are Nitro handlers over the in-memory list in `server/utils/todos.ts`. The POST handler waits 500 ms and fails about 30% of the time, so the rollback is easy to see.

To run this example:

- `npm install`
- `npm run dev`
