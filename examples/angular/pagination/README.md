# TanStack Angular Query Pagination Example

Paginated projects with `placeholderData: keepPreviousData`, so the current page stays visible while the next one loads. The next page is prefetched.

## How it works

- `src/app/services/projects/queries.ts` is an `@Injectable` `ProjectsQueries` whose `list(page)` returns `queryOptions` keyed by `['projects', 'list', page]`, converting the `HttpClient` call from `src/app/services/projects/api.ts` with `lastValueFrom`.
- `src/app/components/example.component.ts` spreads `list(this.page())` into `injectQuery` with `placeholderData: keepPreviousData` and a 5-second `staleTime`. While the next page loads, `data()` still holds the previous page and `isPlaceholderData()` is `true`, which disables the "Next Page" button.
- An `effect` in `src/app/components/example.component.ts` fetches the next page ahead of time with `queryClient.query(this.#projectsQueries.list(newPage))` when the current page has `hasMore: true` and is not placeholder data.
- `src/app/api/projects-mock.interceptor.ts` is an `HttpInterceptorFn`, registered with `withInterceptors` in `src/app/app.config.ts`, that answers `/api/projects` with 10 projects per page after a 1-second delay.

To run this example:

- `npm install`
- `npm start`
