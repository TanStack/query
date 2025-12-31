---
id: Angular-HttpClient-and-other-data-fetching-clients
title: Angular HttpClient and other data fetching clients
---

Because TanStack Query's fetching mechanisms are agnostically built on Promises, you can use literally any asynchronous data fetching client, including the browser native `fetch` API, `graphql-request`, and more.

## Using Angular's `HttpClient` for data fetching

`HttpClient` is a powerful and integrated part of Angular, which gives the following benefits:

- Mock responses in unit tests using [provideHttpClientTesting](https://angular.dev/guide/http/testing).
- [Interceptors](https://angular.dev/guide/http/interceptors) can be used for a wide range of functionality including adding authentication headers, performing logging, etc. While some data fetching libraries have their own interceptor system, `HttpClient` interceptors are integrated with Angular's dependency injection system.
- `HttpClient` automatically informs [`PendingTasks`](https://angular.dev/api/core/PendingTasks#), which enables Angular to be aware of pending requests. Unit tests and SSR can use the resulting application _stableness_ information to wait for pending requests to finish. This makes unit testing much easier for [Zoneless](https://angular.dev/guide/zoneless) applications.
- When using SSR, `HttpClient` will [cache requests](https://angular.dev/guide/ssr#caching-data-when-using-HttpClient) performed on the server. This will prevent unneeded requests on the client. `HttpClient` SSR caching works out of the box. TanStack Query has its own hydration functionality which may be more powerful but requires some setup. Which one fits your needs best depends on your use case.

### Using observables in `queryFn`

As TanStack Query is a promise based library, observables from `HttpClient` need to be converted to promises. This can be done with the `lastValueFrom` or `firstValueFrom` functions from `rxjs`.

```ts
@Component({
  // ...
})
class ExampleComponent {
  private readonly http = inject(HttpClient)

  readonly query = injectQuery(() => ({
    queryKey: ['repoData'],
    queryFn: () =>
      lastValueFrom(
        this.http.get('https://api.github.com/repos/tanstack/query'),
      ),
  }))
}
```

> Since Angular is moving towards RxJS as an optional dependency, it's expected that `HttpClient` will also support promises in the future.

## Comparison table

| Data fetching client                                | Pros                                                | Cons                                                                       |
| --------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------- |
| **Angular HttpClient**                              | Featureful and very well integrated with Angular.   | Observables need to be converted to Promises.                              |
| **Fetch**                                           | Browser native API, so adds nothing to bundle size. | Barebones API which lacks many features.                                   |
| **Specialized libraries such as `graphql-request`** | Specialized features for specific use cases.        | If it's not an Angular library it won't integrate well with the framework. |
