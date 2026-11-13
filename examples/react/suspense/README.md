# TanStack React Query Suspense Example

Loads projects with suspense queries, and resets failed queries from an error boundary.

## How it works

- `src/services/projects/queries.ts` defines `projectsQueries.list()` and `projectsQueries.detail(id)` with `queryOptions`. `src/services/projects/api.ts` fetches TanStack repositories from the GitHub API and adds a 1-second delay.
- `src/components/Projects.tsx` and `src/components/Project.tsx` are lazy-loaded and read their data with `useSuspenseQuery`, so the `React.Suspense` fallback in `src/index.tsx` shows until the data and the component code are ready.
- The "Show Projects" button in `src/index.tsx` starts `queryClient.query(projectsQueries.list())`, and the "Load" button in `src/components/Projects.tsx` starts `queryClient.query(projectsQueries.detail(project.full_name))`, before the state change that renders the component, so fetching runs in parallel with loading the component code.
- `src/components/Button.tsx` wraps clicks in `startTransition` and shows a spinner while the transition `isPending`.
- `src/index.tsx` wraps the boundary in `QueryErrorResetBoundary` and passes its `reset` to the `ErrorBoundary` from `react-error-boundary`, so "Try again" resets the failed queries before rendering again. The `QueryClient` sets `retry: 0` so errors show right away.

To run this example:

- `npm install`
- `npm run dev`
