# TanStack React Query Hydration Example (Next.js Pages Router)

Prefetches posts in `getStaticProps`, dehydrates the cache, and hydrates it in the browser with `HydrationBoundary`.

Built with [Next.js (Pages Router)](https://nextjs.org/docs/pages).

## How it works

- `src/services/posts/queries.ts` defines `postsQueries.list(limit)` with `queryOptions`, keyed by `['posts', 'list', limit]`. `src/services/posts/api.ts` fetches the posts from JSONPlaceholder and keeps the first `limit` of them.
- `src/pages/index.tsx` runs `queryClient.query(postsQueries.list(10))` on a fresh `QueryClient` in `getStaticProps` and returns `dehydrate(queryClient)` as `dehydratedState`.
- `src/pages/_app.tsx` passes `pageProps.dehydratedState` to `HydrationBoundary`, and its `QueryClient` sets a `staleTime` of 1 minute, so the prefetched list is not refetched on mount while it is less than a minute old. Hydration keeps the time the data was fetched in `getStaticProps`, so a page served later than that refetches.
- `src/components/PostList.tsx` reads `useQuery(postsQueries.list(postCount))`, and "Show More" raises `postCount` by 10, which fetches a new list. On `src/pages/client-only.tsx` the same component runs without prefetching, so the first list is fetched in the browser.

To run this example:

- `npm install`
- `npm run dev`
