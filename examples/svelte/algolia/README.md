# TanStack Svelte Query Algolia Example

Searches products on Algolia as you type, with a debounced search term and paginated results loaded with an infinite query.

## How it works

- `src/lib/services/products/queries.ts` defines `productsQueries.search(...)`, an `infiniteQueryOptions` factory keyed by `['products', 'search', indexName, query, hitsPerPage]`. It uses `skipToken` while the search term is empty, and `getNextPageParam` stops at the last page reported by Algolia.
- `src/lib/services/products/api.ts` calls Algolia's `searchSingleIndex` with the page number from `pageParam`.
- `src/lib/Search.svelte` debounces the input by 300 ms with `createDebouncedValue` from TanStack Pacer and passes the debounced term to `src/lib/SearchResults.svelte`.
- `src/lib/SearchResults.svelte` passes the options to `createInfiniteQuery` with a 30-second `staleTime` and a `select` that flattens `data.pages` into one list, and loads more results with `fetchNextPage` while `hasNextPage` is `true`.

To run this example:

- `npm install`
- `npm run dev`
