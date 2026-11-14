# TanStack Vue Query Persister Example

Persists each query on its own with `experimental_createQueryPersister`: the post list to `localStorage` and each post to IndexedDB.

## How it works

- `src/services/posts/queries.ts` creates two persisters with `experimental_createQueryPersister`: one on `localStorage` and one on IndexedDB through `idb-keyval`.
- In `src/services/posts/queries.ts`, `postsQueries.list()` passes `postsPersister.persisterFn` (the `localStorage` one) as `persister` with a 5-second `staleTime`, and `postsQueries.detail(id)` passes `postPersister.persisterFn` (the IndexedDB one).
- `src/PostList.vue` reads the list with `useQuery(postsQueries.list())`, shows "Refetching..." while `isRefetching` is `true`, and marks a post as visited when `queryClient.getQueryData(postsQueries.detail(item.id).queryKey)` returns data.
- `src/PostDetail.vue` passes a getter, `useQuery(() => postsQueries.detail(props.postId))`, so the query follows the `postId` prop.
- `src/main.ts` installs `VueQueryPlugin` with a default `gcTime` of 24 hours, and `src/services/posts/api.ts` delays the list response by 1 second.

To run this example:

- `npm install`
- `npm run dev`
