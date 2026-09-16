---
id: error-handling
title: Error Handling
---

Query and mutation errors are exposed through their result signals. The adapter does not report
failed requests to a global error handler automatically.

To report cache failures to Angular's `ErrorHandler`, configure the cache callbacks when creating
the client. Capture the handler in the provider factory, where `inject()` is available:

```ts
import { ErrorHandler, inject } from '@angular/core'
import {
  MutationCache,
  QueryCache,
  QueryClient,
  provideTanStackQuery,
} from '@tanstack/angular-query'

export const queryProviders = provideTanStackQuery(() => {
  const errors = inject(ErrorHandler)

  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (query.meta?.reportToErrorHandler !== false) {
          errors.handleError(error)
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.meta?.reportToErrorHandler !== false) {
          errors.handleError(error)
        }
      },
    }),
  })
})
```

This example reports failures by default. Set `meta: { reportToErrorHandler: false }` on a query or
mutation which your application handles locally. Compose these callbacks with any cache callbacks
you already use.

A query cache callback reports a failed cache operation once, even when several components observe
the query. Observer-only `select` errors and exceptions in options or `combine` computations are
not cache failures and are not reported by this recipe.

`mutateAsync()` rejects and can be caught with `try`/`catch`. `mutate()` returns void; use mutation
callbacks or result signals for its error state. `refetch({ throwOnError: true })` opts into promise
rejection for that call.

The [Resource view](../resource-api.md) throws from `value()` when its mapped status is `error`.
Check `hasValue()` before reading it. An uncaught error while Angular renders a template can still
reach Angular's error handler. This integration does not provide a component error boundary.
