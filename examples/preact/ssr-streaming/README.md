# TanStack Preact Query SSR Streaming Example

Streams server-rendered HTML with Suspense, sending each query's data to the client as it resolves.

## How it works

- `src/services/wait/queries.ts` defines `waitQueries.detail(wait)`, a `queryOptions` factory keyed by `['wait', 'detail', wait]` that calls `/api/wait`.
- `src/App.tsx` renders components that call `useSuspenseQuery`, each inside its own `Suspense` boundary, plus three that share one boundary.
- `src/entry-server.tsx` starts every query up front with `queryClient.query(...).catch(noop)` and subscribes to the query cache. Each query that succeeds is `dehydrate`d on its own and written as a `<script>` that pushes the state to `window.__QUERY_STATES__` before the next chunk of `renderToPipeableStream` output.
- `src/entry-client.tsx` calls `hydrate(queryClient, state)` for every entry in `window.__QUERY_STATES__` before Preact's `hydrate`.
- `server.js` is an Express server that streams the render into the response and serves `/api/wait`, which responds after the requested number of milliseconds.

To run this example:

- `npm install`
- `npm run dev`
