# TanStack Preact Query Basic GraphQL Request Example

The basic posts example, fetching from a GraphQL API with `graphql-request`.

## How it works

- `src/services/posts/queries.ts` defines `postsQueries.list()` and `postsQueries.detail(postId)`, `queryOptions` factories keyed by `['posts', 'list']` and `['posts', 'detail', postId]`.
- `src/services/posts/api.ts` sends `gql` queries with `request` from `graphql-request` to the GraphQLZero API.
- In `src/index.tsx`, `Posts` and `Post` pass the factories to `useQuery`. `Posts` calls `queryClient.getQueryData(postsQueries.detail(post.id).queryKey)` to show posts that are already cached in bold green.

To run this example:

- `npm install`
- `npm run dev`
