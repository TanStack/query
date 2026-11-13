# TanStack Solid Query Suspense Example

Loads projects inside `<Suspense>`, with an error boundary for failed queries.

## How it works

- `src/services/projects/queries.ts` defines `projectsQueries.list()` and `projectsQueries.detail(id)` with `queryOptions`. `src/services/projects/api.ts` fetches TanStack repositories from the GitHub API and adds a 1-second delay.
- `src/components/Projects.tsx` and `src/components/Project.tsx` read the data with `useQuery` and `throwOnError: true`. Reading `data` inside `<Suspense>` suspends until the query resolves, and a spinner shows while `isFetching` is `true`.
- `src/index.tsx` wraps the lazy-loaded components in `<Suspense>` and an `ErrorBoundary` whose "Try again" button calls `reset`. The `QueryClient` sets `retry: 0`, so errors reach the boundary right away.
- Clicking "Show Projects" in `src/index.tsx` and "Load" in `src/components/Projects.tsx` starts the fetch with `queryClient.query(...)` before the component that needs the data renders.

To run this example:

- `npm install`
- `npm run dev`
