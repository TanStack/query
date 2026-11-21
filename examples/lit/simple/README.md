# TanStack Lit Query Simple Example

Fetches a single GitHub repository and shows its stats.

## How it works

- `src/services/repos/queries.ts` defines `reposQueries.detail()`, a `queryOptions` factory keyed by `['repos', 'detail']` that fetches the TanStack Query repository from the GitHub API.
- `src/main.ts` passes it to `createQueryController` in `<simple-example>` and shows the repository's name, description, and counts, with "Updating..." while `isFetching` is `true`.
- `src/main.ts` also subclasses `QueryClientProvider` to set the `QueryClient` for the elements inside it.

To run this example:

- `npm install`
- `npm run dev`
