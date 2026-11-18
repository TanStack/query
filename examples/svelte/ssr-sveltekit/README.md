# TanStack Svelte Query SSR Example (SvelteKit)

Fills the cache in SvelteKit `load` functions with SvelteKit's `fetch`, so pages render on the server with data and the browser reuses the responses SvelteKit inlined instead of fetching again.

Built with [SvelteKit](https://svelte.dev/docs/kit).

## How it works

- `src/lib/services/posts/queries.ts` defines `postsQueries.list(limit, customFetch)` and `postsQueries.detail(id, customFetch)` with `queryOptions`. The optional `customFetch` lets a `load` function pass SvelteKit's `fetch` to `src/lib/services/posts/api.ts`.
- `src/routes/+layout.ts` creates the `QueryClient` in a `load` function with a 1-minute `staleTime` and `enabled: browser`, and `src/routes/+layout.svelte` provides it with `QueryClientProvider`.
- `src/routes/+page.ts` and `src/routes/[postId]/+page.ts` get the client from `parent()` and fill the cache with `queryClient.query(...)` using SvelteKit's `fetch`, so the page is rendered on the server with data.
- `src/lib/Posts.svelte` and `src/lib/Post.svelte` read the same options with `createQuery`, and `src/lib/Posts.svelte` calls `client.getQueryData(postsQueries.detail(post.id).queryKey)` to style links whose detail is already cached.

To run this example:

- `npm install`
- `npm run dev`
