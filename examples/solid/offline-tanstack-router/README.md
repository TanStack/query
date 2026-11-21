# TanStack Solid Query Offline Example (TanStack Router)

A movie list that keeps working offline. Queries and mutations are persisted, mutations made offline are paused, and they resume when the connection returns or after a reload.

Built with [TanStack Router](https://tanstack.com/router).

## How it works

- `src/services/movies/queries.ts` defines `moviesQueries.list()` and `moviesQueries.detail(id)` with `queryOptions`, and `moviesMutations.update()` with `mutationOptions`. The `mutationFn` cancels the detail query through `context.client.cancelQueries` before posting the comment.
- `src/App.tsx` wraps the app in `PersistQueryClientProvider` with a `createAsyncStoragePersister` on `localStorage` and a 24-hour `gcTime`. `queryClient.setMutationDefaults(moviesQueries.all(), ...)` registers the mutation function, so paused mutations restored after a reload can run, and `onSuccess` calls `queryClient.resumePausedMutations()`. It passes `useIsRestoring()` to the router context.
- `src/routes/index.tsx` and `src/routes/$movieId.tsx` read the movies with `useQuery`. The detail route's `loader` returns cached data from `queryClient.getQueryData`, and otherwise calls `queryClient.query(...)` only when `onlineManager.isOnline()` is `true` and the cache is not being restored.
- `src/routes/$movieId.tsx` updates the comment with `useMutation`, writing it to the cache in `onMutate` with `queryClient.setQueryData`, rolling back in `onError` and invalidating in `onSettled`. While offline the mutation is paused and `isPaused` is `true`.
- `src/mocks.ts` uses MSW in the browser to serve `/movies` and `/movies/:id` from an in-memory list with a 500 ms delay.

To run this example:

- `npm install`
- `npm run dev`
