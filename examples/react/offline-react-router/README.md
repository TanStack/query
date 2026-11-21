# TanStack React Query Offline Example (React Router)

A movie list that keeps working offline. Queries and mutations are persisted, mutations made offline are paused, and they resume when the connection returns or after a reload.

Built with [React Router](https://reactrouter.com).

## How it works

- `src/services/movies/queries.ts` defines `moviesQueries.list()` and `moviesQueries.detail(id)` with `queryOptions`, and `moviesMutations.update()` with `mutationOptions`, whose `mutationFn` cancels the detail query before posting the comment.
- `src/App.tsx` wraps the router in `PersistQueryClientProvider` with a `localStorage` persister and registers `moviesMutations.update()` with `queryClient.setMutationDefaults(moviesQueries.all(), ...)`, so mutations restored after a reload still have a `mutationFn`. Its `onSuccess` calls `queryClient.resumePausedMutations()` and then `invalidateQueries()`.
- The `loader` in `src/routes/detail.tsx` fetches the movie with `queryClient.query` only when it is not cached, `onlineManager.isOnline()` is `true`, and the cache is not being restored. Otherwise `useQuery` in the component handles it.
- `src/routes/detail.tsx` updates the comment with `useMutation` and a `mutationKey` under `['movies']`, writing it optimistically in `onMutate` with `queryClient.setQueryData` and rolling back in `onError`. While offline, the mutation `isPaused` and the page shows "mutation paused - offline". `src/routes/list.tsx` reads `useQuery(moviesQueries.list())`.
- `src/mocks.ts` sets up an MSW worker that serves `GET /movies`, `GET /movies/:id`, and `POST /movies/:id` with a 500 ms delay.

To run this example:

- `npm install`
- `npm run dev`
