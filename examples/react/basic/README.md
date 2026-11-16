# TanStack React Query Basic Example

A list of posts and a post detail view. Posts you have already opened are marked as visited from the query cache. The cache is persisted to `localStorage`.

## How it works

- `src/services/posts/queries.ts` defines `postsQueries.list()` and `postsQueries.detail(id)` with `queryOptions`, keyed under `['posts']`. `src/services/posts/api.ts` fetches the posts from JSONPlaceholder.
- `src/index.tsx` renders `Posts` with `useQuery(postsQueries.list())` and `Post` with `useQuery(postsQueries.detail(postId))`. Both show "Background Updating..." while `isFetching` is `true`.
- In `src/index.tsx`, the list marks a post as visited when `queryClient.getQueryData(postsQueries.detail(post.id).queryKey)` returns cached data.
- `src/index.tsx` wraps the app in `PersistQueryClientProvider` with a `createAsyncStoragePersister` over `window.localStorage`, and its `QueryClient` sets `gcTime` to 24 hours so the persisted queries are kept.

To run this example:

- `npm install`
- `npm run dev`
