# TanStack Solid Query Devtools Panel Example

Embeds the devtools as a panel inside the page instead of the floating toggle.

## How it works

- `src/services/repos/queries.ts` defines `reposQueries.detail()` with `queryOptions`, keyed by `['repos', 'detail']`, and `src/services/repos/api.ts` fetches the `TanStack/query` repository from the GitHub API.
- `src/index.tsx` reads the repository with `useQuery` in the `Example` component.
- The same file renders `SolidQueryDevtoolsPanel` inside the page when the toggle button is clicked, and its `onClose` callback hides the panel again.

To run this example:

- `npm install`
- `npm run dev`
