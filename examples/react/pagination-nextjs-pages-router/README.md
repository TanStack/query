# TanStack React Query Pagination Example (Next.js Pages Router)

Paginated projects with `placeholderData: keepPreviousData`, so the current page stays visible while the next one loads. The next page is prefetched.

Built with [Next.js (Pages Router)](https://nextjs.org/docs/pages).

## How it works

- `src/services/projects/queries.ts` defines `projectsQueries.list(page)`, a `queryOptions` factory keyed by `['projects', 'list', page]` with a 5-second `staleTime`.
- `src/pages/index.tsx` passes it to `useQuery` with `placeholderData: keepPreviousData`. While the next page loads, `data` still holds the previous page and `isPlaceholderData` is `true`, which disables the "Next Page" button.
- When a page arrives with `hasMore: true`, the next page is fetched ahead of time with `queryClient.query(projectsQueries.list(page + 1))`.
- `src/pages/api/projects.ts` is a Next.js API route that returns 10 projects per page after a 1-second delay.

To run this example:

- `npm install`
- `npm run dev`
