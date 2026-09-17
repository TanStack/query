---
id: Angular-HttpClient-and-other-data-fetching-clients
title: Angular HttpClient
---

TanStack Query works with any data fetching client that returns a Promise, including the browser's
`fetch` API and clients such as `graphql-request`.

## Using Angular's `HttpClient` for data fetching

Angular's `HttpClient` returns Observables, which query and mutation functions do not consume
directly. Convert the Observable with RxJS's `firstValueFrom` or `lastValueFrom`. Query functions
can also return a synchronous value.

```ts
@Component({
  // ...
})
class ExampleComponent {
  private readonly http = inject(HttpClient)

  readonly repoDataQuery = injectQuery(() => ({
    queryKey: ['repoData'],
    queryFn: () =>
      firstValueFrom(
        this.http.get('https://api.github.com/repos/tanstack/query'),
      ),
  }))
}
```

For regular `HttpClient` requests, `firstValueFrom` resolves the single response and unsubscribes.
Use `lastValueFrom` when the Observable emits multiple values and the query should resolve with the
last one.

Angular [HTTP interceptors](https://angular.dev/guide/http/interceptors) continue to apply to
requests made inside query and mutation functions.

## SSR

When using `HttpClient` with SSR, prefer Angular Query's built-in query hydration and disable
Angular's HTTP transfer cache. Otherwise, both systems serialize the same request data.

Add
[`withNoHttpTransferCache()`](https://angular.dev/api/platform-browser/withNoHttpTransferCache) to
[`provideClientHydration()`](https://angular.dev/api/platform-browser/provideClientHydration). See
the [SSR guide](./guides/ssr.md) for the complete setup.

For cancellation, see [Query Cancellation](./guides/query-cancellation.md).
