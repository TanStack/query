# TanStack Preact Query Suspense Example

Loads projects with suspense queries, and resets failed queries from an error boundary.

## How it works

- `src/services/projects/queries.ts` defines `projectsQueries.list()` and `projectsQueries.detail(id)`, `queryOptions` factories for TanStack repositories from the GitHub API.
- `src/components/Projects.tsx` and `src/components/Project.tsx` read their data with `useSuspenseQuery`. Clicking "Load" starts the detail fetch with `queryClient.query(projectsQueries.detail(project.full_name))` before switching views.
- `src/index.tsx` lazy-loads both components inside `Suspense`. Pressing "Show Projects" starts the list fetch with `queryClient.query(projectsQueries.list())` while the component code is still loading.
- `src/index.tsx` also wraps them in `QueryErrorResetBoundary`, whose `reset` is passed as `onReset` to `src/components/ErrorBoundary.tsx`, a `useErrorBoundary` wrapper. "Try again" resets the failed queries so they fetch again. The `QueryClient` sets `retry: 0`.

To run this example:

- `npm install`
- `npm run dev`
