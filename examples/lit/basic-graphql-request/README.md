# TanStack Lit Query Basic GraphQL Request Example

The basic posts example, fetching from a GraphQL API with `graphql-request`.

## How it works

- `src/services/posts/queries.ts` defines `postsQueries.list()` and `postsQueries.detail(postId)`, `queryOptions` factories keyed by `['posts', 'list']` and `['posts', 'detail', postId]`.
- `src/services/posts/api.ts` sends `gql` queries with `request` from `graphql-request` to the GraphQLZero API.
- `src/post-list.ts` and `src/post-detail.ts` read the factories with `createQueryController`. `<post-list>` calls `useQueryClient().getQueryData(postsQueries.detail(post.id).queryKey)` to show posts that are already cached in bold green.
- `src/main.ts` subclasses `QueryClientProvider` to set the shared `QueryClient` and switches between the two elements on a `set-post-id` event.

To run this example:

- `npm install`
- `npm run dev`
