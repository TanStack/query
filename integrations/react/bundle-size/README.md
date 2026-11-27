# React Query app bundle size

This workspace builds three browser apps against each adapter’s public package entry point. The read-only app fetches a book list. The paginated app uses the query, infinite-query and mutation option factories to fetch additional pages and save bookmarks in browser storage. The polling app refreshes all four regular and suspense query hooks. All builds include React and React DOM and use the default client. The original and standalone adapters accept a numeric interval. The pluggable adapter imports its interval scheduler through the `refetchInterval` option helper. The benchmark checks that only the polling build of that adapter includes the scheduler.

Run from the repository root after installing the workspace dependencies:

```sh
pnpm --filter '@tanstack/query-integration-react-bundle-size^...' run build
pnpm --filter @tanstack/query-integration-react-bundle-size run measure
```

The report at `integrations/react/bundle-size/dist/report.md` shows total emitted JavaScript bytes and the sum of individually compressed chunks for gzip and Brotli. Each percentage uses the original adapter’s application size for that workload as its denominator. Serve a directory under `dist/<workload>/<adapter>` to try the built app.

Run the nine production app scenarios in Chromium after measuring:

```sh
cd integrations/react/bundle-size
pnpm exec playwright install chromium
pnpm test:browser
pnpm test:browser:ui
```

The last command starts Vitest in watch mode with a browser UI for inspecting and rerunning each adapter’s scenarios.
