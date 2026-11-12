# TanStack React Query Suspense Streaming Example

Streams suspense queries from the server with `ReactQueryStreamedHydration`, so each query's data reaches the client as it resolves.

Built with [Next.js (App Router)](https://nextjs.org/docs/app).

## How it works

- `src/services/wait/queries.ts` defines `waitQueries.detail(wait)` with `queryOptions`. `src/services/wait/api.ts` calls `/api/wait`, using an absolute URL when `environmentManager.isServer()` is `true`.
- `src/app/providers.tsx` creates a `QueryClient` per request on the server and one in the browser, and wraps the app in `ReactQueryStreamedHydration` from `@tanstack/react-query-next-experimental`.
- `src/app/page.tsx` is a Client Component that renders `MyComponent` with `useSuspenseQuery(waitQueries.detail(wait))` for waits from 100 to 1000 ms. Each of the first seven has its own `Suspense` boundary and appears as soon as its query resolves; the last three share one boundary and appear together.
- `src/app/api/wait/route.ts` is a route handler that responds with `waited ${wait}ms` after the requested delay.

To run this example:

- `npm install`
- `npm run dev`
