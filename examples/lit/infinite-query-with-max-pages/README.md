# TanStack Lit Query Infinite Query With Max Pages Example

An infinite list that loads pages in both directions and keeps at most 3 pages in the cache with `maxPages`.

## How it works

- `src/services/projects/queries.ts` defines `projectsQueries.infinite()`, an `infiniteQueryOptions` factory with `initialPageParam: 0`, `getNextPageParam` and `getPreviousPageParam` that read `nextId` and `previousId`, and `maxPages: 3`.
- `src/main.ts` passes it to `createInfiniteQueryController`. "Load Older" calls `fetchPreviousPage` and "Load Newer" calls `fetchNextPage` on the controller, and once 3 pages are cached, loading a page in one direction drops the page at the other end.
- `src/mocks.ts` is an MSW handler for `/api/projects` that returns 4 projects per cursor after a 300 ms delay. `nextId` is `null` once the cursor reaches 20, and `previousId` is `null` once it reaches -20.

To run this example:

- `npm install`
- `npm run dev`
