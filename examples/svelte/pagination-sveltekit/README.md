# TanStack Svelte Query Pagination Example (SvelteKit)

Paginated projects with `placeholderData: keepPreviousData`, so the current page stays visible while the next one loads. The next page is prefetched.

Built with [SvelteKit](https://svelte.dev/docs/kit).

## How it works

- `src/lib/services/projects/queries.ts` defines `projectsQueries.list(page)`, a `queryOptions` factory keyed by `['projects', 'list', page]` with a 5-second `staleTime`.
- `src/routes/+page.svelte` passes it to `createQuery` with `placeholderData: keepPreviousData`. While the next page loads, `data` still holds the previous page and `isPlaceholderData` is `true`, which disables the "Next Page" button.
- When a page arrives with `hasMore: true`, an `$effect` fetches the next page ahead of time with `queryClient.query(projectsQueries.list(page + 1))`.
- `src/routes/api/projects/+server.ts` is a SvelteKit endpoint that returns 10 projects per page after a 1-second delay.

To run this example:

- `npm install`
- `npm run dev`
