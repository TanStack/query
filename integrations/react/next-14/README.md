# TanStack React Query Next.js 14 Integration

Checks that `@tanstack/react-query` and `@tanstack/react-query-devtools` build and type-check with Next.js 14 and React 18 using the App Router.

## What it checks

- `app/providers.tsx` creates a `QueryClient` with `React.useState` and renders `QueryClientProvider` with `ReactQueryDevtools` in a client component.
- `app/page.tsx` is a server component that builds options with `queryOptions` and renders `app/client-component.tsx`, which reads a query with `useQuery`.
- `next.config.js` sets `eslint.ignoreDuringBuilds` and `typescript.ignoreBuildErrors`, so `next build` skips type checking. The `test:types` script type-checks instead with `tsc --noEmit`.
- CI runs the `build` script (`next build`) and the `test:types` script.

To run it from the repository root:

- `pnpm nx run @tanstack/query-integration-react-next-14:build`
- `pnpm nx run @tanstack/query-integration-react-next-14:test:types`
