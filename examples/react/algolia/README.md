# TanStack React Query Algolia Example

Searches products on Algolia as you type, with a debounced search term and paginated results loaded with an infinite query.

## How it works

- `src/services/products/queries.ts` defines `productsQueries.search(...)`, an `infiniteQueryOptions` factory keyed by `['products', 'search', indexName, query, hitsPerPage]`. When `query` is empty, `queryFn` is `skipToken`, so nothing is fetched, and `getNextPageParam` returns the next page until `nbPages` is reached.
- `src/services/products/api.ts` calls Algolia's `searchSingleIndex` with the page number and hits per page.
- `src/Search.tsx` debounces the input by 300 ms with `useDebouncedValue` from TanStack Pacer and passes the debounced term to `SearchResults`.
- `src/SearchResults.tsx` passes the options to `useInfiniteQuery` with a `select` that flattens `pages` into one list of hits, plus `staleTime` (30 seconds) and `gcTime` (15 minutes). The "more" button calls `fetchNextPage` while `hasNextPage` is `true`.

To run this example:

- `npm install`
- `npm run dev`

## HTTP QUERY verb (RFC 10008)

The Algolia search calls in this example normally ride on POST, like every other Algolia request. If you set `VITE_HTTP_QUERY_VERB=1`, the two read search endpoints are upgraded to the new HTTP QUERY verb, and nothing else is touched — so no write operation can ever become a QUERY. By default the client first sends an OPTIONS preflight to check that the server advertises QUERY support (via the `Accept-Query` or `Allow` header) and falls back to POST when it does not. Set `VITE_HTTP_QUERY_VERB_TRUST=1` to skip that check if you already know the endpoint supports QUERY. To see it end to end, run `pnpm mock` (a local QUERY-capable mock on port 8048 that stands in for Algolia's search endpoints) together with `VITE_ALGOLIA_MOCK_BASE=http://localhost:8048`.
