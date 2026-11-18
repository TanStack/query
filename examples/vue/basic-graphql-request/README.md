# TanStack Vue Query Basic GraphQL Request Example

The basic posts example, fetching from a GraphQL API with `graphql-request`.

## How it works

- `src/services/posts/api.ts` sends GraphQL queries with `request` and `gql` from `graphql-request`: the list asks only for `id` and `title`, and the detail asks for `body` as well.
- `src/services/posts/queries.ts` wraps those calls in `postsQueries.list()` and `postsQueries.detail(postId)`, `queryOptions` factories keyed by `['posts', 'list']` and `['posts', 'detail', postId]`.
- `src/PostList.vue` reads the list with `useQuery(postsQueries.list())` and shows a post in bold green when `queryClient.getQueryData(postsQueries.detail(post.id).queryKey)` returns data.
- `src/PostDetail.vue` passes a getter, `useQuery(() => postsQueries.detail(props.postId))`, so the query follows the `postId` prop and shows "Background Updating..." while `isFetching` is `true`.

To run this example:

- `npm install`
- `npm run dev`
