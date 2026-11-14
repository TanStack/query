# TanStack React Query Infinite Query With Max Pages Example (Next.js Pages Router)

An infinite list that loads pages in both directions and keeps at most 3 pages in the cache with `maxPages`.

Built with [Next.js (Pages Router)](https://nextjs.org/docs/pages).

## How it works

- `src/services/projects/queries.ts` defines `projectsQueries.infinite()`, an `infiniteQueryOptions` factory keyed by `['projects', 'infinite']` with `initialPageParam: 0`, `getPreviousPageParam` and `getNextPageParam` reading `previousId` and `nextId` from the page, and `maxPages: 3`.
- `src/pages/index.tsx` passes it to `useInfiniteQuery`. "Load Older" calls `fetchPreviousPage` and "Load Newer" calls `fetchNextPage`; once 3 pages are loaded, fetching in one direction drops the page at the other end, so `data.pages` never holds more than 3 pages.
- `src/pages/api/projects.ts` is a Next.js API route that returns 4 projects per page for a `cursor` between -20 and 20, with `nextId` and `previousId`, after a 300 ms delay.

To run this example:

- `npm install`
- `npm run dev`
