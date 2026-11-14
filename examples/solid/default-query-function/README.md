# TanStack Solid Query Default Query Function Example

Sets a default `queryFn` on the `QueryClient` that builds the request URL from the query key, so each query only passes a `queryKey`.

## How it works

- `src/index.tsx` defines `defaultQueryFn`, which fetches `https://jsonplaceholder.typicode.com` plus the first element of the `queryKey`, and sets it as `defaultOptions.queries.queryFn` on the `QueryClient`.
- The `Posts` component calls `useQuery` with only `queryKey: ['/posts']`, and the `Post` component with ``queryKey: [`/posts/${props.postId}`]`` and `enabled: !!props.postId`. Neither passes a `queryFn`.
- The `Posts` list calls ``queryClient.getQueryData([`/posts/${post.id}`])`` to style links whose post is already cached.

To run this example:

- `npm install`
- `npm run dev`
