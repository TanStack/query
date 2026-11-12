# TanStack Lit Query Offline Example

A movie list that keeps working offline. Queries and mutations are persisted, mutations made offline are paused, and they resume when the connection returns or after a reload.

Built with [`@lit-labs/router`](https://www.npmjs.com/package/@lit-labs/router).

## How it works

- `src/services/movies/queries.ts` defines `moviesQueries.list()` and `moviesQueries.detail(id)` with `queryOptions`, and `moviesMutations.update()` with `mutationOptions`. Its `mutationFn` calls `context.client.cancelQueries` for the movie before posting the comment.
- `src/queryClient.ts` creates the `QueryClient` and a `createAsyncStoragePersister` backed by `localStorage`, and calls `queryClient.setMutationDefaults(moviesQueries.all(), ...)` so persisted mutations can resume after a reload.
- `src/main.ts` restores the cache with `persistQueryClient` from `@tanstack/query-persist-client-core`, then calls `queryClient.resumePausedMutations()` and `invalidateQueries()`. Its `@lit-labs/router` `enter` hook for `/:movieId` loads the movie with `queryClient.query(...)` when it is not cached and `onlineManager.isOnline()` is `true`, and a button toggles `onlineManager.setOnline`.
- `src/movie-list-view.ts` and `src/movie-detail-view.ts` read the movies with `createQueryController`. The detail view's `createMutationController` sets `mutationKey` to the movie's query key, writes the comment optimistically in `onMutate`, restores it in `onError`, invalidates in `onSettled`, and shows when the mutation `isPaused`.
- `src/mocks.ts` is an MSW handler for `/movies` and `/movies/:id` with a 500 ms delay. The POST handler saves the comment in uppercase.

To run this example:

- `npm install`
- `npm run dev`
