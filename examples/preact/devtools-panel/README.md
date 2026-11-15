# TanStack Preact Query Devtools Panel Example

Embeds the devtools as a panel inside the page instead of the floating toggle.

## How it works

- `src/services/repos/queries.ts` defines `reposQueries.detail()`, a `queryOptions` factory keyed by `['repos', 'detail']` that fetches the TanStack Query repository from the GitHub API.
- In `src/index.tsx`, `Example` passes it to `useQuery` and shows the repository's name, description, and counts.
- `App` in `src/index.tsx` renders `PreactQueryDevtoolsPanel` inline when the toggle button is pressed, and the panel's `onClose` hides it again.

To run this example:

- `npm install`
- `npm run dev`
