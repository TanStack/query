# React Query app bundle size

This workspace builds four browser apps against each adapter’s public package entry point. The read-only app fetches a book list with `useQuery(options)` in v6 and `useQuery(queryOptions(options))` in the treeshakable adapter. The paginated app uses the query, infinite-query and mutation option factories to fetch additional pages and save bookmarks in browser storage. The polling app refreshes regular and infinite queries, both with and without Suspense. The treeshakable app calls `useQuery` with `queryOptions(options)`, `infiniteQueryOptions(options)`, `suspenseQueryOptions(options)` or `suspenseInfiniteQueryOptions(options)` for each subscriber. The browser test holds the first responses until both dedicated Suspense boundaries show their fallbacks, then checks the resolved data and subsequent refetches. The options app keeps the previous page while fetching, selects the displayed titles, saves bookmarks in a serial scope, and invalidates the bookmark list. Each app uses the default client. The original adapter accepts a numeric interval. The treeshakable adapter imports its interval scheduler through the `refetchInterval` option helper.

CI builds the original adapter and its dependencies from the PR's base commit. Both checkouts use the public names `@tanstack/react-query` and `@tanstack/query-core`. The fixture uses the PR head’s bundler and React dependencies for both builds. The report records both commit IDs.

## What the PR comment measures

The opening table compares the gzipped Query runtime for each workload. It shows the byte difference and percentage change from v6. The next table lists implementations shipped by v6 that the treeshakable build omits for each workload. The comparison checks emitted modules, retained exports and the source map symbols of v6’s built-in polling, selection, placeholder and scope handling. For bulk cache operations it also checks v6's emitted public method names. Expand the Query runtime table for the minified, gzip level 9 and Brotli quality 11 byte counts.

Vite builds the same HTML and React entry points with React, React DOM and their subpaths external. Rolldown groups the retained modules from the adapter and its core package into one ESM chunk. The app and its workload-specific helpers stay in a separate entry chunk. The benchmark measures and compresses the emitted Query chunk directly, including its ESM import and export bindings. Each percentage uses the v6 chunk for the same workload and encoding.

The read-only app displays a failed query through its returned result. Its Query chunk must omit the error reset boundary, render-time error handling and the `shouldThrowError` predicate. The emitted JavaScript must also omit calls to the boundary’s `clearReset` API. The polling app includes the reset boundary for its Suspense queries. A separate consumer builds an ordinary `useQuery` with `throwOnError: [throwOnError, true]`. It must retain the boundary handling and exclude Suspense fetching. All four treeshakable workloads must retain `replaceData` and `replaceEqualDeep`, which implement default structural sharing.

The treeshakable options app calls `invalidateQueries(client, { queryKey: ['bookmarks'] })`. Every named client operation takes the client first. The benchmark checks retained exports to verify that importing `QueryClient` leaves out `query(client, options)`, `infiniteQuery(client, options)`, `setQueryData` and bulk operations, and that each named operation is available when imported.

For each app, the benchmark verifies that the isolated Query chunk contains the same retained Query module IDs and exports as the deployable browser build and imports only React peer entry points. Both builds verify that all Query modules come from their selected checkout. Individual probes import operations directly from the public `@tanstack/query-core` entry using the React adapter’s dependency scope. Both the read-only and polling apps construct a `QueryClient` and use queries. The treeshakable build must retain the query cache and observer and exclude the mutation cache, mutation and mutation observer. Both bookmark apps call `useMutation` and must retain all three mutation modules. The ordinary and infinite option factories select their respective observers. The treeshakable adapter exposes `useQuery` for all four modes. Its bundle contains no `useBaseQuery` wrapper, and the bare `useQuery` export leaves out both concrete observers. The benchmark checks the minified Query chunk for the optimistic fetch `Promise.race` in the Suspense workload and its absence in the other three. Each Suspense option factory is also tested independently against its ordinary counterpart. The read-only app excludes the infinite observer, both Suspense factories and their common policy. The polling app exercises all four factories. A separate probe verifies that `suspenseQueryOptions` excludes the infinite factory and observer, and that `suspenseInfiniteQueryOptions` excludes the regular-only factories. Pagination and polling retain the infinite query builder, observer and page fetcher. The read-only and selection apps exclude the page fetcher. Chromium exercises the included implementation by requesting and rendering the second page. All four hook-driven apps exclude both imperative operations. The regular operation is the named `query` export of the client module. Hook-driven apps still retain the core `Query` class. The `infiniteQuery` operation adds page fetching when imported. Additional checks cover polling, infinite queries, selection, placeholder data, serial queues and bulk cache operations. Individual public export probes also check selection, placeholder data and serial queues. The query cache lookups (`findCachedQuery` and `findCachedQueries`), `clearQueryCache`, and active, disabled, static and stale query predicates are measured as named core exports. The invalidation workload retains the filters and refetch predicates it calls, including `invalidateCachedQuery`, `getQueryObserverCount` and `isQueryFetched`. The other three workloads omit these functions. All four omit `resetCachedQuery`; a separate public import probe verifies that it remains available. The benchmark checks all fourteen query result helpers in isolation, then verifies the exact set retained by each screen. The read-only and options apps import `isPending` and `isError`. Pagination additionally imports `isFetching`, and polling reads the query data without any status helpers. The React hydration boundary only restores queries. The universal `hydrate` also restores serial queues from saved mutations.

The PR comment links to the workflow artifact containing an interactive HTML bundle analyzer for each package and workload. Open `dist/analyzer/<workload>/<adapter>.html` locally after running the benchmark. Select the `query-runtime` chunk to explore its constituent sources. The treemap shows module contributions from source maps. The tables use actual compressed chunk bytes.

## Lazy route navigation

Open the catalog, visit Bookmarks, load a second page, then return to the catalog. One React root and one `QueryClientProvider` stay mounted for the whole visit. The shell imports the catalog at startup. `React.lazy` loads the bookmarks screen on its first render, and a React `Suspense` boundary shows a fallback while that JavaScript arrives. The catalog uses an ordinary data query.

For the above-the-fold (ATF) and below-the-fold (BTF) layout, open the same app with `?layout=scroll`. The catalog renders immediately. An `IntersectionObserver` mounts the bookmarks component the first time its shelf intersects the viewport. Merely placing a mounted `React.lazy` component below the fold would request its module on the initial render. The navigation and scroll examples share the same dynamic import and emitted files. [React shell and viewport trigger](./src/lazy/main.tsx)

The catalog imports its ordinary-query helper from a dedicated module. Keeping pagination and mutation imports on the bookmarks side gives the bundler a route boundary to follow. In stock v6 the shared client constructs a mutation cache, and its core fetch path references infinite-page behavior. The treeshakable pair can defer both implementations until the bookmarks component loads. [v6 client](https://github.com/TanStack/query/blob/dc33f10cc5d7334a3b473fdf576b5d2aeb57ef4b/packages/query-core/src/queryClient.ts) · [v6 fetch path](https://github.com/TanStack/query/blob/dc33f10cc5d7334a3b473fdf576b5d2aeb57ef4b/packages/query-core/src/query.ts) · [Catalog hook](./src/treeshakable-catalog.ts) · [Paginated hook](./src/treeshakable-query.ts)

The lazy-route table reports Query bytes for the cold catalog, the first trip to Bookmarks, both screens together, and the return trip. Each URL is counted once in the cumulative total. A larger incremental download on the second route can go along with a smaller first load when more of the feature's code can wait for the click. Read the phase rows alongside the total. [Measurement](./lazyRoutes.ts) · [Chromium navigation test](./browser/lazyRoutes.test.ts)

| To explore                                                                  | Example code                                                                                                            |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Reading a list and handling pending and error states                        | [Catalog](./src/query.tsx)                                                                                              |
| Fetching another page and saving a bookmark                                 | [Paginated list and mutation](./src/paginated.tsx)                                                                      |
| Selecting titles, showing placeholders and invalidating after queued writes | [Screen](./src/options.tsx) · [v6 options](./src/v6-options.ts) · [Treeshakable options](./src/treeshakable-options.ts) |
| Polling regular, infinite and Suspense queries                              | [Polling screen](./src/polling.tsx) · [Treeshakable interval](./src/treeshakable-interval.ts)                           |

## Microfrontend navigation

A shell loads the catalog first and the paginated bookmarks screen on navigation. Both remotes use the host’s React and React DOM and create a client when mounted. In the independent deployment, each remote is built on its own and has a separate Query URL. In the shared deployment, the shell serves one ESM Query chunk containing both routes’ imports. The table reports the gzip bytes of the Query URLs needed for the catalog alone and for the complete journey. Chromium verifies the requests on both visits and on returning to the catalog. The measured bytes describe JavaScript transfer. They do not measure cross-client data caching.

## Run locally

From the repository root, prepare the same v6 checkout used by CI. Its commit pins the original APIs and byte baseline as the treeshakable implementation changes. Both TypeScript and the bundler resolve the v6 adapter from this checkout.

```sh
git worktree add --detach .cache/query-bundle-base dc33f10cc5d7334a3b473fdf576b5d2aeb57ef4b
pnpm --dir .cache/query-bundle-base --filter root --filter '@tanstack/react-query...' install --frozen-lockfile
pnpm --dir .cache/query-bundle-base --filter '@tanstack/react-query...' run build
pnpm --filter '@tanstack/query-integration-react-bundle-size^...' run build
pnpm --filter @tanstack/query-integration-react-bundle-size run test:types
pnpm --filter @tanstack/query-integration-react-bundle-size run check:baseline
pnpm --filter @tanstack/query-integration-react-bundle-size run measure
```

`test:types` checks the current app screens, tools, microfrontend host and browser tests. `check:baseline` checks the same screens against the v6 declarations. Both commands open the fixture in the TypeScript language server to verify editor imports.

Read the summary and detailed tables in `integrations/react/bundle-size/dist/report.md`. Serve a directory under `dist/<workload>/<adapter>` to try the built app.

To try the lazy routes, run `pnpm exec vite preview --outDir dist` from this directory after measuring. Open `/lazy-routes/v6/` or `/lazy-routes/treeshakable/` on the printed URL. Append `?layout=scroll` to try scrolling to the shelf. The Network panel shows which JavaScript each visit requests.

Run the production apps, lazy routes and microfrontend journeys in Chromium after measuring.

```sh
cd integrations/react/bundle-size
pnpm exec playwright install chromium
pnpm test:browser
pnpm test:browser:ui
```

The last command starts Vitest in watch mode with a browser UI for inspecting and rerunning each adapter’s scenarios.
