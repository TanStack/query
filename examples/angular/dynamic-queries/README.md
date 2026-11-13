# TanStack Angular Query Dynamic Queries Example

A list of items where each item has its own query. Adding or removing an item adds or removes its query.

## How it works

- `src/app/app.component.ts` keeps the items in a `signal` and maps them to query options inside `injectQueries(() => ({ queries: this.items().map(...) }))`, so the list of queries follows the signal.
- Each query has the key `['item-details', item.id]` and a `queryFn` that resolves mock details after a short delay.
- The template reads each result by index, for example `queries()[index].isPending()` and `queries()[index].data()`.
- `src/app/app.config.ts` registers the `QueryClient` with `provideTanStackQuery` and `withDevtools()`.

To run this example:

- `npm install`
- `npm start`
