# React Query app bundle size

This workspace builds four browser apps against each adapter’s public package entry point. The read-only app fetches a book list. The paginated app uses the query, infinite-query and mutation option factories to fetch additional pages and save bookmarks in browser storage. The polling app refreshes all four regular and suspense query hooks. The options app keeps the previous page while fetching, selects the displayed titles, saves bookmarks in a serial scope, and invalidates the bookmark list. Each app uses the default client. The original and standalone adapters accept a numeric interval. The pluggable adapter imports its interval scheduler through the `refetchInterval` option helper.

CI builds the original adapter and its dependencies from the PR's base commit. The two alternatives, the app code, the bundler and both React packages come from the PR head. The report records both commit IDs.

## What the PR comment measures

1. **Query runtime used by the app.** Vite builds the same HTML and React entry points with React, React DOM and their subpaths external. Rolldown groups the adapter’s retained modules into one ESM chunk, including `@tanstack/query-core` for the original adapter. The app and its workload-specific helpers stay in a separate entry chunk. The benchmark directly measures the minified Query chunk, including its ESM import and export bindings. Its gzip and Brotli sizes describe compressing this chunk on its own. Percentages use the original adapter’s isolated chunk for that workload and encoding.
2. **Whole production app.** Vite builds the deployable application with its ordinary chunk layout, including React, React DOM, the app and the adapter. Each percentage uses the original adapter’s full app for that workload and encoding. Compressing these complete chunks accounts for compression shared between the app and its dependencies.

Both tables show the emitted JS byte length, gzip at level 9 and Brotli at quality 11. The benchmark compresses each emitted JS chunk independently and sums the lengths. HTML, source maps and analysis reports are excluded.

For each app, the benchmark verifies that the isolated Query chunk contains the same retained Query module IDs and exports as the whole production app and imports only React peer entry points. The production app checks also cover feature-specific modules. Individual public export probes check that selection, placeholder data and serial queues can be removed independently. The React hydration boundary only restores queries. The universal `hydrate` also restores serial queues from saved mutations.

The PR comment links to the workflow artifact containing an interactive HTML bundle analyzer for each package and workload. Open `dist/analyzer/<workload>/<adapter>.html` locally after running the benchmark. Select the `query-runtime` chunk to explore its constituent sources. The treemap shows module contributions from source maps. The tables use actual compressed chunk bytes.

## Run locally

For a comparison within the current checkout, run from the repository root after installing workspace dependencies:

```sh
pnpm --filter '@tanstack/query-integration-react-bundle-size^...' run build
pnpm --filter @tanstack/query-integration-react-bundle-size run measure
```

To reproduce the CI comparison, use a clean worktree of the base commit. Replace `BASE_SHA` with the base commit from the report.

```sh
git worktree add --detach ../query-bundle-base BASE_SHA
pnpm --dir ../query-bundle-base --filter root --filter '@tanstack/react-query...' install --frozen-lockfile
pnpm --dir ../query-bundle-base --filter '@tanstack/react-query...' run build
QUERY_BASE_CHECKOUT="$PWD/../query-bundle-base" pnpm --filter @tanstack/query-integration-react-bundle-size run measure
```

Read both tables in `integrations/react/bundle-size/dist/report.md`. Serve a directory under `dist/<workload>/<adapter>` to try the built app.

Run the twelve production app scenarios in Chromium after measuring:

```sh
cd integrations/react/bundle-size
pnpm exec playwright install chromium
pnpm test:browser
pnpm test:browser:ui
```

The last command starts Vitest in watch mode with a browser UI for inspecting and rerunning each adapter’s scenarios.
