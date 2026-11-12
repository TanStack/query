# TanStack Lit Query Load-More Infinite Scroll Example

An infinite list that loads the next page when a "Load more" button is clicked or when the end of the list scrolls into view.

Built with [`@lit-labs/router`](https://www.npmjs.com/package/@lit-labs/router).

## How it works

- `src/services/projects/queries.ts` defines `projectsQueries.infinite()`, an `infiniteQueryOptions` factory with `initialPageParam: 0` and `getNextPageParam` and `getPreviousPageParam` that read the page's `nextId` and `previousId`.
- `src/example-view.ts` passes it to `createInfiniteQueryController`. An `IntersectionObserver` watches the "Load Newer" button, and `updated()` calls `fetchNextPage` while the button is in view and `hasNextPage` is `true`. The buttons call `fetchNextPage` and `fetchPreviousPage` directly.
- `src/main.ts` sets up `@lit-labs/router` routes for `/` and `/about` inside a `QueryClientProvider` subclass. Going to the about page and back renders the loaded pages from the cache.
- `src/mocks.ts` is an MSW handler for `/api/projects` that returns 5 projects per cursor after a 1-second delay. `nextId` is `null` once the cursor reaches 10, and `previousId` is `null` once it reaches -10.

To run this example:

- `npm install`
- `npm run dev`
