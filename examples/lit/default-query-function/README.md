# TanStack Lit Query Default Query Function Example

Sets a default `queryFn` on the `QueryClient` that builds the request URL from the query key, so each query only passes a `queryKey`.

## How it works

- `src/main.ts` defines `defaultQueryFn`, which fetches `https://jsonplaceholder.typicode.com` plus `queryKey[0]`, and sets it as `defaultOptions.queries.queryFn` on the `QueryClient` passed to a `QueryClientProvider` subclass.
- `src/post-list.ts` calls `createQueryController` with only `queryKey: ['/posts']`, and calls ``useQueryClient().getQueryData([`/posts/${post.id}`])`` to show posts that are already cached in bold green.
- `src/post-detail.ts` calls `createQueryController` with only ``queryKey: [`/posts/${this.postId}`]`` and `enabled: !!this.postId`.

To run this example:

- `npm install`
- `npm run dev`
