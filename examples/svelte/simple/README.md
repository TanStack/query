# TanStack Svelte Query Simple Example

Fetches a single GitHub repository and shows its stats.

## How it works

- `src/App.svelte` creates a `QueryClient` and provides it to the app with `QueryClientProvider`.
- `src/lib/Simple.svelte` calls `createQuery` with an inline `queryKey: ['repoData']` and a `queryFn` that fetches the `TanStack/query` repository from the GitHub API.
- It renders the loading state from `isPending`, the error from `error`, and the repository stats from `data` once `isSuccess` is `true`.

To run this example:

- `npm install`
- `npm run dev`
