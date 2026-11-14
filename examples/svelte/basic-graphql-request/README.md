# TanStack Svelte Query Basic GraphQL Request Example

The basic posts example, fetching from a GraphQL API with `graphql-request`.

## How it works

- `src/lib/services/posts/queries.ts` defines `postsQueries.list()` and `postsQueries.detail(postId)` with `queryOptions`, keyed by `['posts', 'list']` and `['posts', 'detail', postId]`.
- `src/lib/services/posts/api.ts` sends GraphQL queries with `request` and `gql` from `graphql-request` to the GraphQLZero API.
- `src/lib/Posts.svelte` and `src/lib/Post.svelte` pass these options to `createQuery`. `src/App.svelte` switches between them based on the selected post id.
- `src/lib/Posts.svelte` calls `queryClient.getQueryData(postsQueries.detail(post.id).queryKey)` to style links whose detail is already cached.

To run this example:

- `npm install`
- `npm run dev`
