# TanStack Solid Query Pagination Example (SolidStart)

Paginated projects with `placeholderData: keepPreviousData`, so the current page stays visible while the next one loads. The next page is prefetched.

Built with [SolidStart](https://start.solidjs.com).

## How it works

- `src/services/projects/queries.ts` defines `projectsQueries.list(page)`, a `queryOptions` factory keyed by `['projects', 'list', page]` with a 5-second `staleTime`.
- `src/services/projects/api.ts` is a SolidStart server function marked with `'use server'` that returns 10 projects per page after a 1-second delay, with `hasMore: page < 9`, so the tenth page is the last one.
- `src/routes/index.tsx` passes the options to `useQuery` with `placeholderData: keepPreviousData`. While the next page loads, `data` still holds the previous page and `isPlaceholderData` is `true`, which disables the "Next Page" button.
- When a page arrives with `hasMore: true`, a `createEffect` fetches the next page ahead of time with `queryClient.query(projectsQueries.list(page() + 1))`.

To run this example:

- `npm install`
- `npm run dev`
