# React Query app bundle size

This workspace builds four browser apps against each adapter’s public package entry point. The read-only app fetches a book list. The paginated app uses the query, infinite-query and mutation option factories to fetch additional pages and save bookmarks in browser storage. The polling app refreshes all four regular and suspense query hooks. The options app keeps the previous page while fetching, selects the displayed titles, saves bookmarks in a serial scope, and invalidates the bookmark list. All builds include React and React DOM and use the default client. The original and standalone adapters accept a numeric interval. The pluggable adapter imports its interval scheduler through the `refetchInterval` option helper. The benchmark checks retained modules in each app and bundles individual public exports to check that selection, placeholder data and serial queues can be removed independently. The React hydration boundary only restores queries. The universal `hydrate` also restores serial queues from saved mutations.

CI builds the original adapter and its dependencies from the PR's base commit. The two alternatives, the app code, the bundler and both React packages come from the PR head. The report records both commit IDs.

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

The report at `integrations/react/bundle-size/dist/report.md` shows total emitted JavaScript bytes and the sum of individually compressed chunks for gzip and Brotli. Each percentage uses the original adapter’s application size for that workload as its denominator. Serve a directory under `dist/<workload>/<adapter>` to try the built app.

Run the twelve production app scenarios in Chromium after measuring:

```sh
cd integrations/react/bundle-size
pnpm exec playwright install chromium
pnpm test:browser
pnpm test:browser:ui
```

The last command starts Vitest in watch mode with a browser UI for inspecting and rerunning each adapter’s scenarios.
