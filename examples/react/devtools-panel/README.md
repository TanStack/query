# TanStack React Query Devtools Panel Example

Embeds the devtools as a panel inside the page instead of the floating toggle.

## How it works

- `src/services/repos/queries.ts` defines `reposQueries.detail()` with `queryOptions`, and `src/services/repos/api.ts` fetches the `TanStack/query` repository from the GitHub API.
- `src/index.tsx` reads it with `useQuery(reposQueries.detail())` and shows the repository's counts.
- A button in `src/index.tsx` toggles `ReactQueryDevtoolsPanel`, which renders the devtools inline in the page, and its `onClose` callback hides the panel again.

To run this example:

- `npm install`
- `npm run dev`
