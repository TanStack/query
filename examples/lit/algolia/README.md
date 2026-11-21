# TanStack Lit Query Algolia Example

Searches products on Algolia as you type, with a debounced search term and paginated results loaded with an infinite query.

## How it works

- `src/services/products/queries.ts` defines `productsQueries.search()`, an `infiniteQueryOptions` factory keyed by the index, search term, and page size. Its `queryFn` is `skipToken` while the term is empty, and `getNextPageParam` returns the next page until `nbPages` is reached.
- `src/services/products/api.ts` calls `searchSingleIndex` from `@algolia/client-search` with the page passed in as `pageParam`.
- `src/search-box.ts` debounces the input by 300 ms with `createDebouncedValue` from `@tanstack/lit-pacer` and passes the debounced term to `<search-results>`.
- `src/search-results.ts` calls `createInfiniteQueryController` with `select` to flatten `data.pages` into one list of hits, plus `staleTime` and `gcTime`. The "more" button calls `fetchNextPage` on the controller while `hasNextPage` is `true`.
- `src/main.ts` subclasses `QueryClientProvider` to set the shared `QueryClient` for the elements inside it.

To run this example:

- `npm install`
- `npm run dev`
