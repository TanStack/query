# React Query app bundle size

This workspace builds two browser apps against each adapter’s public package entry point. The read-only app fetches a book list. The paginated app fetches additional pages and saves bookmarks in browser storage. All three builds of each app include React and React DOM. The paginated pluggable build registers the mutation and infinite-query plugins.

Run from the repository root after installing the workspace dependencies:

```sh
pnpm --filter '@tanstack/query-integration-react-bundle-size^...' run build
pnpm --filter @tanstack/query-integration-react-bundle-size run measure
```

The report at `integrations/react/bundle-size/dist/report.md` shows total emitted JavaScript bytes and the sum of individually compressed chunks for gzip and Brotli. Each percentage uses the original adapter’s application size for that workload as its denominator. Serve a directory under `dist/<workload>/<adapter>` to try the built app.

Run the six production app scenarios in Chromium after measuring:

```sh
cd integrations/react/bundle-size
pnpm exec playwright install chromium
pnpm test:browser
pnpm test:browser:ui
```

The last command starts Vitest in watch mode with a browser UI for inspecting and rerunning each adapter’s scenarios.
