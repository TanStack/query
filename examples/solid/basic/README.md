# TanStack Solid Query Basic Example

A list of posts and a post detail view. Posts you have already opened are marked as visited from the query cache.

## How it works

- `src/services/posts/queries.ts` defines `postsQueries.list()` and `postsQueries.detail(id)` with `queryOptions`, keyed by `['posts', 'list']` and `['posts', 'detail', id]`.
- `src/services/posts/api.ts` fetches the posts from JSONPlaceholder.
- `src/index.tsx` passes these options to `useQuery` in the `Posts` and `Post` components and shows "Background Updating..." while `isFetching` is `true`. The `QueryClient` sets a 24-hour `gcTime`, so opened posts stay in the cache.
- The `Posts` list calls `queryClient.getQueryData(postsQueries.detail(post.id).queryKey)` to style links whose detail is already cached.

To run this example:

- `npm install`
- `npm run dev`
