# TanStack Vue Query Devtools Panel Example

Embeds the devtools as a panel inside the page instead of the floating toggle.

## How it works

- `src/services/repos/queries.ts` defines `reposQueries.detail()`, a `queryOptions` factory keyed by `['repos', 'detail']` that fetches the `TanStack/query` repository from the GitHub API.
- `src/App.vue` reads it with `useQuery(reposQueries.detail())` and shows the repository's name, description and counts.
- `src/App.vue` also renders `VueQueryDevtoolsPanel` inline while `isOpen` is `true`. A button toggles `isOpen`, and the panel's `on-close` sets it back to `false`.

To run this example:

- `npm install`
- `npm run dev`
