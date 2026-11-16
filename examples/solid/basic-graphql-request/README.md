# TanStack Solid Query Basic GraphQL Request Example

The basic posts example, fetching from a GraphQL API with `graphql-request`.

## How it works

- `src/services/posts/queries.ts` defines `postsQueries.list()` and `postsQueries.detail(id)` with `queryOptions`, keyed by `['posts', 'list']` and `['posts', 'detail', id]`.
- `src/services/posts/api.ts` sends GraphQL queries with `request` and `gql` from `graphql-request` to the GraphQLZero API.
- `src/index.tsx` passes these options to `useQuery` in the `Posts` and `Post` components and shows "Background Updating..." while `isFetching` is `true`.
- The `Posts` list calls `queryClient.getQueryData(postsQueries.detail(post.id).queryKey)` to style links whose detail is already cached.

To run this example:

- `npm install`
- `npm run dev`
