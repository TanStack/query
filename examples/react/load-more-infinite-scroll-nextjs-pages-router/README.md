# TanStack React Query Load-More Infinite Scroll Example (Next.js Pages Router)

An infinite list that loads the next page when a "Load more" button is clicked or when the end of the list scrolls into view.

Built with [Next.js (Pages Router)](https://nextjs.org/docs/pages).

## How it works

- `src/services/projects/queries.ts` defines `projectsQueries.infinite()`, an `infiniteQueryOptions` factory keyed by `['projects', 'infinite']` with `initialPageParam: 0`, and `getPreviousPageParam` and `getNextPageParam` reading `previousId` and `nextId` from the page.
- `src/pages/index.tsx` passes it to `useInfiniteQuery`. The "Load Newer" button has a `ref` from `useInView`, and an effect calls `fetchNextPage` when the button scrolls into view while `hasNextPage` is `true`. "Load Older" calls `fetchPreviousPage`.
- `src/pages/about.tsx` is a second page to navigate to and back from, so the cached pages are shown again on return.
- `src/pages/api/projects.ts` is a Next.js API route that returns 5 projects per page for a `cursor` between -10 and 10, with `nextId` and `previousId`, after a 1-second delay.

To run this example:

- `npm install`
- `npm run dev`
