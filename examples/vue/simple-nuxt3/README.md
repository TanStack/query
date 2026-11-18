# TanStack Vue Query Simple Example (Nuxt 3)

Fetches a single GitHub repository and shows its stats.

Built with [Nuxt 3](https://nuxt.com).

## How it works

- `services/repos/queries.ts` defines `reposQueries.detail()`, a `queryOptions` factory keyed by `['repos', 'detail']` that fetches the `TanStack/query` repository from the GitHub API.
- `app.vue` reads it with `useQuery(reposQueries.detail())` and calls `await suspense()` in `<script setup>`, so the repository is fetched during server rendering.
- `plugins/vue-query.ts` is a Nuxt plugin that creates a `QueryClient` with a 5-second `staleTime` and installs `VueQueryPlugin`. On the server it stores `dehydrate(queryClient)` in `useState('vue-query')` on `app:rendered`, and on the client it calls `hydrate` with that state on `app:created`.

To run this example:

- `npm install`
- `npm run dev`
