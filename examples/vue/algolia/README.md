# TanStack Vue Query Algolia Example

Searches products on Algolia as you type, with a debounced search term and paginated results loaded with an infinite query.

## How it works

- `src/services/products/api.ts` calls `searchSingleIndex` from `@algolia/client-search` with the query, page and `hitsPerPage`, and returns the `hits` and `nbPages`.
- `src/services/products/queries.ts` defines `productsQueries.search(...)`, an `infiniteQueryOptions` factory keyed by `['products', 'search', indexName, query, hitsPerPage]`. It uses `skipToken` as the `queryFn` while the query is empty, starts at `initialPageParam: 0`, and `getNextPageParam` stops at `nbPages`.
- `src/SearchBox.vue` debounces the input by 300 ms with `useDebouncedValue` from `@tanstack/vue-pacer` and passes the debounced value to the results.
- `src/SearchResults.vue` passes a getter to `useInfiniteQuery` with `staleTime` and `gcTime` added, flattens `data.pages` into one list, and loads more with `fetchNextPage` while `hasNextPage` is `true`.

To run this example:

- `npm install`
- `npm run dev`
