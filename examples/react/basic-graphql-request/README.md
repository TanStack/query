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

## HTTP QUERY verb (RFC 10008)

The fetches in this example stay plain GraphQL-over-HTTP POST requests, as always. If you set `VITE_HTTP_QUERY_VERB=1`, read-only operations are instead sent with the new HTTP QUERY verb. By default the app first sends a preflight OPTIONS request to check that the endpoint advertises QUERY support (via the `Accept-Query` or `Allow` header) and falls back to POST if it does not; set `VITE_HTTP_QUERY_VERB_TRUST=1` to skip that check and send QUERY right away. To see it work end to end, run `pnpm mock` (a local QUERY-capable GraphQL mock on port 8047) and point the app at it with `VITE_GQL_ENDPOINT=http://localhost:8047/api`. Mutations are never sent as QUERY — they always use POST.
