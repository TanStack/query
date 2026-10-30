# `require-prefetch` demo apps

Small apps that show what [`@tanstack/query-prefetch/require-prefetch`](../../../../docs/eslint/require-prefetch.md) reports for each framework it supports. They are linted but never installed, built, or type-checked. Each one has its own `package.json`, because the rule detects the framework from the nearest `package.json`.

| Folder                   | Framework                      | Where queries have to be prefetched                                                                |
| ------------------------ | ------------------------------ | -------------------------------------------------------------------------------------------------- |
| `../src/routes`          | TanStack Router (type-checked) | the route's `loader` or `beforeLoad`                                                               |
| `next-app`               | Next.js App Router             | a server component above the client component (the page or a layout), inside `<HydrationBoundary>` |
| `waku-app`               | Waku                           | the same as Next.js                                                                                |
| `react-router-framework` | React Router framework mode    | the route's `loader` (dehydrated) or `clientLoader`, or those of a parent route in `routes.ts`     |
| `react-router-data`      | React Router data mode         | the route's `loader`, or a parent route's                                                          |

Every route, page, or layout starts with a comment:

- `// ✅ passes:` explains why the rule doesn't report it.
- `// ❌ fails:` explains what is wrong. The reported line has an `eslint-disable-next-line` comment above it that quotes the message the rule reports.

## Verifying

From `examples/react/eslint-plugin-demo` (build the plugins first with `pnpm --filter "@tanstack/eslint-plugin-query*" build`, since the demo uses their build output):

```sh
# Passes only if every ❌ is reported exactly where its disable comment is, and nothing else is
pnpm test:eslint

# Shows every error the rule reports, ignoring the disable comments
pnpm demo:require-prefetch
```

To try a change, edit a ✅ file so it no longer prefetches (for example, delete the `queryClient.query(...)` line of a page) and run `pnpm demo:require-prefetch`: the rule reports the query at the element or route option that renders it.
