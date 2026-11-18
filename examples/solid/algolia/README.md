# TanStack Solid Query Algolia Example

Searches products on Algolia as you type, with a debounced search term and paginated results loaded with an infinite query.

## How it works

- `src/services/products/queries.ts` defines `productsQueries.search(...)`, an `infiniteQueryOptions` factory keyed by `['products', 'search', indexName, query, hitsPerPage]`. It uses `skipToken` while the search term is empty, and `getNextPageParam` stops at the last page reported by Algolia.
- `src/services/products/api.ts` calls Algolia's `searchSingleIndex` with the page number from `pageParam`.
- `src/Search.tsx` debounces the input by 300 ms with `createDebouncedValue` from TanStack Pacer and passes the debounced term to `src/SearchResults.tsx`.
- `src/SearchResults.tsx` passes the options to `useInfiniteQuery` with a 30-second `staleTime`, flattens `data.pages` into one list, and loads more results with `fetchNextPage` while `hasNextPage` is `true`.

To run this example:

- `npm install`
- `npm run dev`
