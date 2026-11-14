# TanStack React Query Basic GraphQL Request Example

The basic posts example, fetching from a GraphQL API with `graphql-request`.

## How it works

- `src/services/posts/queries.ts` defines `postsQueries.list()` and `postsQueries.detail(postId)` with `queryOptions`, keyed under `['posts']`.
- `src/services/posts/api.ts` sends GraphQL queries to GraphQLZero with `request` and `gql` from `graphql-request`, selecting only `id` and `title` for the list.
- `src/index.tsx` renders `Posts` with `useQuery(postsQueries.list())` and `Post` with `useQuery(postsQueries.detail(postId))`. Both show "Background Updating..." while `isFetching` is `true`.
- In `src/index.tsx`, the list marks a post as visited when `queryClient.getQueryData(postsQueries.detail(post.id).queryKey)` returns cached data.

To run this example:

- `npm install`
- `npm run dev`
