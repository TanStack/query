# TanStack Vue Query Dependent Queries Example

A query that waits for another query's result with `enabled`.

## How it works

- `src/services/posts/queries.ts` defines `postsQueries.list()` and `postsQueries.detail(id)`, `queryOptions` factories keyed by `['posts', 'list']` and `['posts', 'detail', id]`.
- `src/services/authors/queries.ts` defines `authorsQueries.detail(id)`, which uses `skipToken` as the `queryFn` while `id` is `undefined`.
- `src/PostDetail.vue` loads the post with `useQuery(() => postsQueries.detail(props.postId))`, derives `authorId` from `post.value?.userId` with `computed`, and passes it to a second `useQuery`. The author query runs only after the post has arrived, and the author name appears next to the title.
- `src/PostList.vue` reads the list with `useQuery(postsQueries.list())` and marks a post as visited when `queryClient.getQueryData(postsQueries.detail(item.id).queryKey)` returns data.

To run this example:

- `npm install`
- `npm run dev`
