# TanStack Lit Query Pagination Example

Paginated projects with `placeholderData: keepPreviousData`, so the current page stays visible while the next one loads. The next page is prefetched.

## How it works

- `src/services/projects/queries.ts` defines `projectsQueries.list(page)`, a `queryOptions` factory keyed by `['projects', 'list', page]` with a 5-second `staleTime`.
- `src/main.ts` passes it to `createQueryController` with `placeholderData: keepPreviousData`. While the next page loads, `data` still holds the previous page and `isPlaceholderData` is `true`, which disables the "Next Page" button.
- In `updated()`, when a page arrives with `hasMore: true`, the next page is fetched ahead of time with `queryClient.query(projectsQueries.list(this.page + 1))`.
- `src/mocks.ts` is an MSW handler for `/api/projects` that returns 10 projects per page after a 1-second delay, with `hasMore: page < 9`.

To run this example:

- `npm install`
- `npm run dev`
