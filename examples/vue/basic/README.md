# TanStack Vue Query Basic Example

A list of posts and a post detail view. Posts you have already opened are marked as visited from the query cache.

## How it works

- `src/services/posts/queries.ts` defines `postsQueries.list()` and `postsQueries.detail(id)`, `queryOptions` factories keyed by `['posts', 'list']` and `['posts', 'detail', id]`.
- `src/PostList.vue` reads the list with `useQuery(postsQueries.list())` and marks a post as visited when `queryClient.getQueryData(postsQueries.detail(item.id).queryKey)` returns data.
- `src/PostDetail.vue` passes a getter, `useQuery(() => postsQueries.detail(props.postId))`, so the query follows the `postId` prop. A cached post renders at once and shows "Background Updating..." while `isFetching` is `true`.
- `src/main.ts` installs `VueQueryPlugin`, and `src/App.vue` switches between the list and the detail view and renders `VueQueryDevtools`.

To run this example:

- `npm install`
- `npm run dev`
