# React Query app bundle size

This workspace builds four browser apps against each adapter’s public package entry point. The read-only app fetches a book list with `useQuery(options)` in v6 and `useQuery(queryOptions(options))` in the pluggable adapter. The paginated app uses the query, infinite-query and mutation option factories to fetch additional pages and save bookmarks in browser storage. The polling app refreshes regular and infinite queries, both with and without Suspense. The pluggable app calls `useQuery` with `queryOptions(options)`, `infiniteQueryOptions(options)`, `suspenseQueryOptions(options)` or `suspenseInfiniteQueryOptions(options)` for each subscriber. The browser test holds the first responses until both dedicated Suspense boundaries show their fallbacks, then checks the resolved data and subsequent refetches. The options app keeps the previous page while fetching, selects the displayed titles, saves bookmarks in a serial scope, and invalidates the bookmark list. Each app uses the default client. The original adapter accepts a numeric interval. The pluggable adapter imports its interval scheduler through the `refetchInterval` option helper.

CI builds the original adapter and its dependencies from the PR's base commit. The stock pair is `@tanstack/react-query` and `@tanstack/query-core`. The experimental pair is `@tanstack/react-query-pluggable` and `@tanstack/query-core-pluggable`. The experimental packages, fixture, bundler and React dependencies come from the PR head. The report records both commit IDs.

## What the PR comment measures

The opening table compares the gzipped Query runtime for each workload. It shows both package sizes in bytes and the signed change in bytes and percent relative to v6. Expand either detail table to see the absolute minified, gzip and Brotli sizes.

1. **Query runtime used by the app.** Vite builds the same HTML and React entry points with React, React DOM and their subpaths external. Rolldown groups the adapter’s retained modules into one ESM chunk, including all retained modules from that pair’s core package. The app and its workload-specific helpers stay in a separate entry chunk. The benchmark directly measures the minified Query chunk, including its ESM import and export bindings. Its gzip and Brotli sizes describe compressing this chunk on its own. Percentages use the original adapter’s isolated chunk for that workload and encoding.
2. **Whole production app.** Vite builds the deployable application with its ordinary chunk layout, including React, React DOM, the app and the adapter. Each percentage uses the original adapter’s full app for that workload and encoding. Compressing these complete chunks accounts for compression shared between the app and its dependencies.

Both tables show the emitted JS byte length, gzip at level 9 and Brotli at quality 11. The benchmark compresses each emitted JS chunk independently and sums the lengths. HTML, source maps and analysis reports are excluded.

The pluggable options app calls `invalidateQueries(client, { queryKey: ['bookmarks'] })`. Every named client operation takes the client first. The benchmark checks retained exports to verify that importing `QueryClient` leaves out `fetchQuery`, `setQueryData` and bulk operations, and that each named operation is available when imported.

For each app, the benchmark verifies that the isolated Query chunk contains the same retained Query module IDs and exports as the whole production app and imports only React peer entry points. Both builds reject runtime modules from the other pair or another checkout. Individual probes import operations directly from the public `@tanstack/query-core-pluggable` entry using the React adapter’s dependency scope. Both the read-only and polling apps construct a `QueryClient` and use queries. The pluggable build must retain the query cache and observer and exclude the mutation cache, mutation and mutation observer. Both bookmark apps call `useMutation` and must retain all three mutation modules. The ordinary and infinite option factories select their respective observers. The bare `useQuery` export leaves out both concrete observers. The read-only app excludes the infinite observer, both Suspense factories and their common policy. The polling app exercises all four factories. A separate probe verifies that `suspenseQueryOptions` excludes the infinite factory and observer, and that `suspenseInfiniteQueryOptions` excludes the regular-only factories. Pagination and polling retain the infinite query builder and observer. All four hook-driven apps exclude the imperative `fetchInfiniteQuery` implementation. Additional checks cover polling, infinite queries, selection, placeholder data, serial queues and bulk cache operations. Individual public export probes check that selection, placeholder data and serial queues can be removed independently. The React hydration boundary only restores queries. The universal `hydrate` also restores serial queues from saved mutations.

The PR comment links to the workflow artifact containing an interactive HTML bundle analyzer for each package and workload. Open `dist/analyzer/<workload>/<adapter>.html` locally after running the benchmark. Select the `query-runtime` chunk to explore its constituent sources. The treemap shows module contributions from source maps. The tables use actual compressed chunk bytes.

## Microfrontend navigation

A shell loads the catalog first and the paginated bookmarks screen on navigation. Both remotes use the host’s React and React DOM and create a client when mounted. In the independent deployment, each remote is built on its own and has a separate Query URL. In the shared deployment, the shell serves one ESM Query chunk containing both routes’ imports. The table reports the gzip bytes of the Query URLs needed for the catalog alone and for the complete journey. Chromium verifies the requests on both visits and on returning to the catalog. The measured bytes describe JavaScript transfer. They do not measure cross-client data caching.

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

Read the summary and detailed tables in `integrations/react/bundle-size/dist/report.md`. Serve a directory under `dist/<workload>/<adapter>` to try the built app.

Run the eight production app scenarios and four microfrontend navigation cases in Chromium after measuring:

```sh
cd integrations/react/bundle-size
pnpm exec playwright install chromium
pnpm test:browser
pnpm test:browser:ui
```

The last command starts Vitest in watch mode with a browser UI for inspecting and rerunning each adapter’s scenarios.
