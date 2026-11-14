# TanStack Solid Query Streaming Example (SolidStart)

Streaming SSR, with one route per case: prefetching, deferred and streamed queries, hydration, mixed queries, batch methods and errors.

Built with [SolidStart](https://start.solidjs.com).

## How it works

- `src/services/posts/queries.ts` and `src/services/users/queries.ts` define `postsQueries.detail(...)` and `usersQueries.detail(...)` with `queryOptions`. Their `sleep` and `simulateError` arguments are part of the `queryKey` and are passed to `src/services/posts/api.ts` and `src/services/users/api.ts` to add latency or throw.
- `src/components/user-info.tsx` and `src/components/post-viewer.tsx` read the data with `useQuery` and forward a `deferStream` prop. `src/components/query-boundary.tsx` wraps a query result in `<Suspense>` and an `ErrorBoundary` with a retry button that calls `refetch`.
- `src/routes/streamed.tsx` streams each query's result to the client when it resolves on the server, while `src/routes/deferred.tsx` and `src/routes/with-error.tsx` set `deferStream` so the server waits for those queries before it sends HTML. `src/routes/mixed.tsx` sets `deferStream` only on the quick `UserInfo` query, so its HTML waits for that query while `PostViewer` streams in afterward.
- `src/routes/prefetch.tsx` starts the user query in the route's `preload` with `queryClient.query(...)`, and `src/routes/hydration.tsx` compares the query state on the server, right after hydration and on the client.
- `src/routes/batch-methods.tsx` switches the scheduler used to batch updates with `notifyManager.setScheduler`.

To run this example:

- `npm install`
- `npm run dev`
