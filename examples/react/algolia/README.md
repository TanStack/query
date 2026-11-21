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
