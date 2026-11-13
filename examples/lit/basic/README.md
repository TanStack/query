# TanStack Lit Query Basic Example

A list of posts and a post detail view. Posts you have already opened are marked as visited from the query cache.

## How it works

- `src/services/posts/queries.ts` defines `postsQueries.list()` and `postsQueries.detail(id)`, `queryOptions` factories keyed by `['posts', 'list']` and `['posts', 'detail', id]`.
- `src/services/posts/api.ts` fetches the posts from JSONPlaceholder.
- `src/post-list.ts` and `src/post-detail.ts` read the factories with `createQueryController`. `<post-list>` calls `useQueryClient().getQueryData(postsQueries.detail(post.id).queryKey)` to show posts that are already cached in bold green.
- `src/main.ts` subclasses `QueryClientProvider` to set the shared `QueryClient` and switches between the two elements on a `set-post-id` event.

To run this example:

- `npm install`
- `npm run dev`
