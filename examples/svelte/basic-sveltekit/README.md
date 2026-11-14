# TanStack Svelte Query Basic Example (SvelteKit)

A list of posts and a post detail view. Posts you have already opened are marked as visited from the query cache. The cache is persisted to `localStorage`.

Built with [SvelteKit](https://svelte.dev/docs/kit).

## How it works

- `src/lib/services/posts/queries.ts` defines `postsQueries.list(limit)` and `postsQueries.detail(id)` with `queryOptions`, keyed by `['posts', 'list', limit]` and `['posts', 'detail', id]`. `src/lib/services/posts/api.ts` fetches the posts from JSONPlaceholder.
- `src/lib/Posts.svelte` reads the first 10 posts with `createQuery` and calls `client.getQueryData(postsQueries.detail(post.id).queryKey)` to style links whose detail is already cached.
- `src/routes/[postId]/+page.ts` is a `load` function that only parses `postId` from the URL. `src/routes/[postId]/+page.svelte` passes it to `src/lib/Post.svelte`, which reads the post with `createQuery`.
- `src/routes/+layout.svelte` wraps the app in `PersistQueryClientProvider` with a `createAsyncStoragePersister` on `localStorage`, and sets `enabled: browser` so queries only run in the browser.

To run this example:

- `npm install`
- `npm run dev`
