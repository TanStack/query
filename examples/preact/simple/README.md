# TanStack Preact Query Simple Example

Fetches a single GitHub repository and shows its stats.

## How it works

- `src/index.tsx` creates a `QueryClient` and provides it with `QueryClientProvider`.
- `Example` in the same file calls `useQuery` with `queryKey: ['repoData']` and an inline `queryFn` that fetches the TanStack Query repository from the GitHub API.
- It shows "Loading..." while `isPending` is `true`, the error message when `error` is set, and "Updating..." while `isFetching` is `true` during a background refetch.

To run this example:

- `npm install`
- `npm run dev`
