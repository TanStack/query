# TanStack React Query Next.js 16 Integration

Checks that `@tanstack/react-query` and `@tanstack/react-query-devtools` build and type-check with Next.js 16 and React 19 using the App Router.

## What it checks

- `app/make-query-client.ts` creates a `QueryClient` that serializes `Temporal.PlainDate` with `tupleson` through `serializeData` and `deserializeData`, dehydrates pending queries, and sets `shouldRedactErrors` to return `false`.
- `app/page.tsx` starts `queryClient.query` on the server without awaiting it, passes `dehydrate(queryClient)` to `HydrationBoundary`, and renders `app/client-component.tsx`, which reads the same query with `useQuery`.
- `app/_action.ts` is a server action that calls `revalidatePath`, and `app/count/route.ts` is a route handler that both query functions fetch.
- `app/providers.tsx` uses `environmentManager.isServer()` to create a new client on the server and reuse one in the browser.
- `next.config.ts` sets `typescript.ignoreBuildErrors`, so `next build` skips type checking. The `test:types` script type-checks instead with `next typegen && tsc --noEmit`.
- CI runs the `build` script (`next build`) and the `test:types` script.

To run it from the repository root:

- `pnpm nx run @tanstack/query-integration-react-next-16:build`
- `pnpm nx run @tanstack/query-integration-react-next-16:test:types`
