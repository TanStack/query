# TanStack Vue Query Simple Example

Fetches a single GitHub repository and shows its stats.

## How it works

- `src/services/repos/queries.ts` defines `reposQueries.detail()`, a `queryOptions` factory keyed by `['repos', 'detail']` that fetches the `TanStack/query` repository from the GitHub API.
- `src/App.vue` reads it with `useQuery(reposQueries.detail())` and shows the repository's name, description and counts, with "Updating..." while `isFetching` is `true`.
- `src/main.ts` installs `VueQueryPlugin` on the app.

To run this example:

- `npm install`
- `npm run dev`
