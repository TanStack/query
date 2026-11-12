# TanStack Preact Query Offline Example (preact-iso)

A movie list that keeps working offline. Queries and mutations are persisted, mutations made offline are paused, and they resume when the connection returns or after a reload.

Built with [preact-iso](https://github.com/preactjs/preact-iso).

## How it works

- `src/services/movies/queries.ts` defines `moviesQueries.list()` and `moviesQueries.detail(id)` with `queryOptions`, and `moviesMutations.update()` with `mutationOptions`. Its `mutationFn` calls `context.client.cancelQueries` for the movie before posting the comment.
- `src/App.tsx` wraps the app in `PersistQueryClientProvider` with a `createAsyncStoragePersister` backed by `localStorage`, and `queryClient.setMutationDefaults(moviesQueries.all(), ...)` registers the mutation function so persisted mutations can resume after a reload. Its `onSuccess` calls `queryClient.resumePausedMutations()` and then `invalidateQueries()`.
- `List` in `src/App.tsx` uses `useQuery(moviesQueries.list())` and prefetches a movie on hover with `queryClient.query(moviesQueries.detail(movie.id))`, only when `onlineManager.isOnline()` is `true` and `useIsRestoring()` is `false`.
- `Detail` in `src/App.tsx` calls `useMutation` with `mutationKey` set to the movie's query key. `onMutate` cancels the query and writes the new comment with `setQueryData`, `onError` restores the previous data, `onSettled` invalidates the movie, and `isPaused` shows when the mutation is waiting for the network.
- `src/mocks.ts` is an MSW handler for `/movies` and `/movies/:id` with a 500 ms delay. The POST handler saves the comment in uppercase.

To run this example:

- `npm install`
- `npm run dev`
