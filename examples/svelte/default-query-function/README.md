# TanStack Svelte Query Default Query Function Example

Sets a default `queryFn` on the `QueryClient` that builds the request URL from the query key, so each query only passes a `queryKey`.

## How it works

- `src/App.svelte` defines `defaultQueryFn`, which fetches `https://jsonplaceholder.typicode.com` plus the first element of the `queryKey`, and sets it as `defaultOptions.queries.queryFn` on the `QueryClient`.
- `src/lib/Posts.svelte` calls `createQuery` with only `queryKey: ['/posts']`, and `src/lib/Post.svelte` with ``queryKey: [`/posts/${postId}`]`` and `enabled: !!postId`. Neither passes a `queryFn`.
- `src/lib/Posts.svelte` calls ``queryClient.getQueryData([`/posts/${post.id}`])`` to style links whose post is already cached.

To run this example:

- `npm install`
- `npm run dev`
