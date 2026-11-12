# TanStack Vue Query Default Query Function Example

Sets a default `queryFn` on the `QueryClient` that builds the request URL from the query key, so each query only passes a `queryKey`.

## How it works

- `src/main.ts` installs `VueQueryPlugin` with a `queryClientConfig` whose `defaultOptions.queries.queryFn` fetches `https://jsonplaceholder.typicode.com` plus `queryKey[0]`.
- `src/PostList.vue` calls `useQuery` with only `queryKey: ['/posts']`, and shows a post in bold green when ``queryClient.getQueryData([`/posts/${post.id}`])`` returns data.
- `src/PostDetail.vue` passes a getter to `useQuery` with ``queryKey: [`/posts/${props.postId}`]`` and `enabled: !!props.postId`, again without a `queryFn`.

To run this example:

- `npm install`
- `npm run dev`
