# TanStack Solid Query SSR Example (Astro)

A Pokémon search with `keepPreviousData` and `<Suspense>`, rendered as a Solid island.

Built with [Astro](https://astro.build).

## How it works

- `src/services/pokemons/queries.ts` defines `pokemonsQueries.list()` and `pokemonsQueries.detail(id)` with `queryOptions`. The detail options set `placeholderData: keepPreviousData` and `throwOnError: true`.
- `src/layouts/MainLayout.astro` renders `SolidApp` from `src/components/SolidApp.tsx` as an island with `client:load`, passing the `id` search param read in `src/pages/index.astro`. Astro runs in `output: 'server'` mode, so the island is rendered on the server first.
- `src/components/SolidApp.tsx` creates the `QueryClient` and wraps the app in `QueryClientProvider` and `<Suspense>`. The side nav and detail view call `useQuery` with `select` to reshape the data and `reconcile` to keep list items stable, and an `ErrorBoundary` shows errors thrown by the detail query.
- `src/components/Link.tsx` and `src/utils/index.ts` handle client-side navigation with `history.pushState` and a signal that tracks the `id` search param. An `is_server_rendered` query in `src/components/SolidApp.tsx` shows whether the current detail was rendered on the server or the client.

To run this example:

- `npm install`
- `npm run dev`
