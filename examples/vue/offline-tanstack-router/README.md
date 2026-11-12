# TanStack Vue Query Offline Example (TanStack Router)

A movie list that keeps working offline. Queries and mutations are persisted, mutations made offline are paused, and they resume when the connection returns or after a reload.

Built with [TanStack Router](https://tanstack.com/router).

## How it works

- `src/services/movies/queries.ts` defines `moviesQueries.list()` and `moviesQueries.detail(id)` with `queryOptions`, and `moviesMutations.update()` with `mutationOptions`. The mutation function cancels the movie's detail query through `context.client.cancelQueries` before sending the comment.
- `src/routes/$movieId.component.vue` reads the movie with `useQuery` and shows a message when `isPaused` is `true` with no data. Its `useMutation` sets `mutationKey` to the movie's query key, updates the cache in `onMutate`, rolls back in `onError`, and shows "mutation paused - offline" while the mutation is paused.
- `src/routes/$movieId.ts` prefetches the movie with `queryClient.query` in the route `loader`, but only when it is not cached, `onlineManager.isOnline()` is `true`, and the cache is not being restored. `src/router.ts` passes the `queryClient` to the router as context.
- `src/queryClient.ts` creates the `QueryClient` with a 24-hour `gcTime`, a `localStorage` persister from `createAsyncStoragePersister`, and `queryClient.setMutationDefaults(moviesQueries.all(), ...)` so mutations paused offline still have a `mutationFn` after a reload. `src/main.ts` passes `persistQueryClient` to `VueQueryPlugin` as `clientPersister`, and once the cache is restored, `clientPersisterOnSuccess` calls `resumePausedMutations` and then `invalidateQueries`.
- `src/mocks.ts` is an MSW worker that serves `/movies` and `/movies/:id` with a 500 ms delay and stores comments in uppercase.

To run this example:

- `npm install`
- `npm run dev`
