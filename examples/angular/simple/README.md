# TanStack Angular Query Simple Example

Fetches a single GitHub repository and shows its stats.

## How it works

- `src/app/components/simple-example.component.ts` calls `injectQuery` with `queryKey: ['repoData']` and a `queryFn` that fetches the `TanStack/query` repository with `HttpClient` and converts it with `lastValueFrom`.
- `src/app/components/simple-example.component.html` renders from the query's signals: `isPending()`, `isError()` with `error()`, and `data()` for the repository's name, description and counts.
- `src/app/app.config.ts` registers a `QueryClient` with `provideTanStackQuery` and `withDevtools()`, and provides `HttpClient` with `provideHttpClient(withFetch())`.

To run this example:

- `npm install`
- `npm start`
