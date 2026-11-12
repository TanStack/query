# TanStack Vue Query Suspense Example

Loads projects in async components that `await` the query's `suspense()` inside `<Suspense>`.

## How it works

- `src/services/projects/queries.ts` defines `projectsQueries.list()` and `projectsQueries.detail(id)`, `queryOptions` factories for TanStack repositories on the GitHub API. `src/services/projects/api.ts` adds a 1-second delay to each request.
- `src/components/ProjectList.vue` and `src/components/ProjectDetail.vue` call `useQuery` with `throwOnError: true` and then `await suspense()` in `<script setup>`, which makes them async components that suspend until the data arrives.
- `src/App.vue` loads both with `defineAsyncComponent` inside `<Suspense>`, shows the `#fallback` slot while they suspend, and catches query errors with `onErrorCaptured`.
- Fetches start before the component suspends: `src/App.vue` calls `queryClient.query(projectsQueries.list())` when showing the projects, and `src/components/ProjectList.vue` calls `queryClient.query(projectsQueries.detail(project))` when a project is clicked.
- `src/transition.ts` provides an `isPending` ref that `<Suspense>` sets from its `pending` and `resolve` events, and `src/components/BaseButton.vue` uses it to show a spinner on the clicked button.

To run this example:

- `npm install`
- `npm run dev`
