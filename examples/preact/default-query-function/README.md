# TanStack Preact Query Default Query Function Example

Sets a default `queryFn` on the `QueryClient` that builds the request URL from the query key, so each query only passes a `queryKey`.

## How it works

- `src/index.tsx` defines `defaultQueryFn`, which fetches `https://jsonplaceholder.typicode.com` plus `queryKey[0]`, and sets it as `defaultOptions.queries.queryFn` on the `QueryClient`.
- In `src/index.tsx`, `Posts` calls `useQuery` with only `queryKey: ['/posts']`, and `Post` with only ``queryKey: [`/posts/${postId}`]`` and `enabled: !!postId`.
- `Posts` also calls ``queryClient.getQueryData([`/posts/${post.id}`])`` to show posts that are already cached in bold green.

To run this example:

- `npm install`
- `npm run dev`
