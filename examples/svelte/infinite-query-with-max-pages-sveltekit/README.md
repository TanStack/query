# TanStack Svelte Query Infinite Query With Max Pages Example (SvelteKit)

An infinite list that loads pages in both directions and keeps at most 3 pages in the cache with `maxPages`.

Built with [SvelteKit](https://svelte.dev/docs/kit).

## How it works

- `src/lib/services/projects/queries.ts` defines `projectsQueries.infinite()` with `infiniteQueryOptions`. `getPreviousPageParam` and `getNextPageParam` read the `previousId` and `nextId` cursors, and `maxPages: 3` limits how many pages stay in `data.pages`.
- `src/lib/services/projects/api.ts` fetches a page from `/api/projects` with the cursor from `pageParam`.
- `src/routes/+page.svelte` reads the pages with `createInfiniteQuery` and loads more in either direction with `fetchPreviousPage` and `fetchNextPage`, guarded by `hasPreviousPage` and `hasNextPage`. When a fourth page is added, the page at the other end is dropped.
- `src/routes/api/projects/+server.ts` is a SvelteKit endpoint that returns 4 projects per cursor after a 300 ms delay, with cursors running from -20 to 20.

To run this example:

- `npm install`
- `npm run dev`
