# TanStack React Query Default Query Function Example

Sets a default `queryFn` on the `QueryClient` that builds the request URL from the query key, so each query can reuse the same fetcher.

## How it works

- `src/index.tsx` defines `fetchByQueryKey`, which fetches `https://jsonplaceholder.typicode.com${queryKey[0]}`, and registers it as `defaultOptions.queries.queryFn` on the `QueryClient`.
- In `src/index.tsx`, `Posts` and `Post` pass `queryOptions` to `useQuery`. Both specify `queryFn: defaultQueryFn` to use the function configured on the client.
- In `src/index.tsx`, the list marks a post as visited when ``getQueryData(queryClient, [`/posts/${post.id}`])`` returns cached data.

To run this example:

- `npm install`
- `npm run dev`
