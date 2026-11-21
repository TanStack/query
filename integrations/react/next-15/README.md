# TanStack React Query Next.js 15 Integration

Checks that `@tanstack/react-query` and `@tanstack/react-query-devtools` build with Next.js 15 and React 19 using the App Router.

## What it checks

- `app/make-query-client.ts` creates a `QueryClient` that serializes `Temporal.PlainDate` with `tupleson` through `serializeData` and `deserializeData`, dehydrates pending queries, and sets `shouldRedactErrors` to return `false`.
- `app/page.tsx` starts `queryClient.query` on the server without awaiting it, passes `dehydrate(queryClient)` to `HydrationBoundary`, and renders `app/client-component.tsx`, which reads the same query with `useQuery`.
- `app/_action.ts` is a server action that calls `revalidatePath`, and `app/count/route.ts` is a route handler that both query functions fetch.
- `app/providers.tsx` uses `environmentManager.isServer()` to create a new client on the server and reuse one in the browser.
- `next.config.ts` sets `eslint.ignoreDuringBuilds` and `typescript.ignoreBuildErrors`, so the build does not type-check.
- CI runs the `build` script (`next build`).

To run it from the repository root:

- `pnpm nx run @tanstack/query-integration-react-next-15:build`
