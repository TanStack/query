# TanStack Svelte Query Load-More Infinite Scroll Example (SvelteKit)

An infinite list that loads the next page when a "Load more" button is clicked.

Built with [SvelteKit](https://svelte.dev/docs/kit).

## How it works

- `src/lib/services/planets/queries.ts` defines `planetsQueries.list()` with `infiniteQueryOptions`, starting at `initialPageParam: 1`. `getNextPageParam` reads the `page` search param from the response's `next` URL and returns `undefined` on the last page.
- `src/lib/services/planets/api.ts` fetches a page of planets from SWAPI.
- `src/lib/LoadMore.svelte` reads the pages with `createInfiniteQuery`, renders every planet in `data.pages`, and calls `fetchNextPage` from the "Load More" button while `hasNextPage` is `true`.
- `src/routes/+layout.svelte` creates the `QueryClient` with `enabled: browser`, so queries only run in the browser.

To run this example:

- `npm install`
- `npm run dev`
