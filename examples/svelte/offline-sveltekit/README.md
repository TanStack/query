# TanStack Svelte Query Offline Example

A movie list that keeps working offline. Queries and mutations are persisted, mutations made offline are paused, and they resume when the connection returns or after a reload.

Built with [SvelteKit](https://svelte.dev/docs/kit).

## How it works

- `src/lib/services/movies/queries.ts` defines `moviesQueries.list()` and `moviesQueries.detail(id)` with `queryOptions`, and `moviesMutations.update()` with `mutationOptions`. The `mutationFn` cancels the detail query through `context.client.cancelQueries` before posting the comment.
- `src/lib/queryClient.ts` creates the `QueryClient` with a 24-hour `gcTime` and a `createAsyncStoragePersister` on `localStorage`. `queryClient.setMutationDefaults(moviesQueries.all(), ...)` registers the mutation function, so paused mutations restored after a reload can run.
- `src/routes/+layout.svelte` wraps the app in `PersistQueryClientProvider` and calls `queryClient.resumePausedMutations()` once the cache is restored. `src/routes/+layout.ts` turns off SSR and starts the mock worker in its `load` function.
- `src/routes/[movieId]/+page.ts` is a `load` function that calls `queryClient.query(...)` only when the movie is not cached and `onlineManager.isOnline()` is `true`. `src/routes/+page.svelte` and `src/routes/[movieId]/+page.svelte` read the movies with `createQuery`.
- `src/routes/[movieId]/+page.svelte` updates the comment with `createMutation`, writing it to the cache in `onMutate` with `queryClient.setQueryData`, rolling back in `onError` and invalidating in `onSettled`. While offline the mutation is paused and `isPaused` is `true`.
- `src/lib/mocks.ts` uses MSW in the browser to serve `/movies` and `/movies/:id` from an in-memory list with a 500 ms delay.

To run this example:

- `npm install`
- `npm run dev`
