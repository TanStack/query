# TanStack Angular Query Infinite Query With Max Pages Example

An infinite list that loads pages in both directions and keeps at most 3 pages in the cache with `maxPages`.

## How it works

- `src/app/services/projects/queries.ts` is an `@Injectable` `ProjectsQueries` whose `list()` returns `infiniteQueryOptions` with `initialPageParam: 0` and `getPreviousPageParam` and `getNextPageParam` reading the page's `previousId` and `nextId`.
- `src/app/components/example.component.ts` spreads `list()` into `injectInfiniteQuery` with `maxPages: 3`, so loading a fourth page drops the page at the other end. It derives the button labels and disabled states with `computed` from `hasNextPage`, `hasPreviousPage`, `isFetchingNextPage` and `isFetchingPreviousPage`.
- `src/app/components/example.component.html` renders every page in `data().pages`, with "Load Older" calling `fetchPreviousPage()` and "Load newer" calling `fetchNextPage()`.
- `src/app/interceptor/projects-mock.interceptor.ts` is an `HttpInterceptorFn`, registered with `withInterceptors` in `src/app/app.config.ts`, that answers `/api/projects` with 4 projects per cursor after 100 to 500 ms, with `nextId` and `previousId` set to `null` past cursor 20 and -20.

To run this example:

- `npm install`
- `npm start`
