# TanStack Preact Query Basic Example

A list of posts and a post detail view. Posts you have already opened are marked as visited from the query cache. The cache is persisted to `localStorage`.

## How it works

- `src/services/posts/queries.ts` defines `postsQueries.list()` and `postsQueries.detail(id)`, `queryOptions` factories keyed by `['posts', 'list']` and `['posts', 'detail', id]`.
- In `src/index.tsx`, `Posts` and `Post` pass them to `useQuery`. `Posts` calls `queryClient.getQueryData(postsQueries.detail(post.id).queryKey)` to show posts that are already cached in bold green.
- In `src/index.tsx`, the `QueryClient` sets `gcTime` to 24 hours, and `PersistQueryClientProvider` saves the cache with a `createAsyncStoragePersister` backed by `window.localStorage`, so visited posts load from the cache after a reload.

To run this example:

- `npm install`
- `npm run dev`
