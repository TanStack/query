# TanStack React Query Default Query Function Example

Sets a default `queryFn` on the `QueryClient` that builds the request URL from the query key, so each query only passes a `queryKey`.

## How it works

- `src/index.tsx` defines `defaultQueryFn`, which fetches `https://jsonplaceholder.typicode.com${queryKey[0]}`, and registers it as `defaultOptions.queries.queryFn` on the `QueryClient`.
- In `src/index.tsx`, `Posts` calls `useQuery<Array<Post>>({ queryKey: ['/posts'] })` and `Post` calls ``useQuery<Post>({ queryKey: [`/posts/${postId}`], enabled: !!postId })``, without a `queryFn`.
- In `src/index.tsx`, the list marks a post as visited when ``queryClient.getQueryData([`/posts/${post.id}`])`` returns cached data.

To run this example:

- `npm install`
- `npm run dev`
