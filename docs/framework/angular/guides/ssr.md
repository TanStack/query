---
id: ssr
title: SSR
---

For [Angular SSR](https://angular.dev/guide/ssr), [`provideTanStackQuery`](../reference/functions/provideTanStackQuery.md) serializes the `QueryClient` cache into Angular's `TransferState` and restores it when the browser application starts.

See the [Angular SSR example](https://github.com/TanStack/query/tree/main/examples/angular/ssr). The
[SSR persistence example](https://github.com/TanStack/query/tree/main/examples/angular/ssr-persist)
builds on the same setup with browser persistence.

## Query client factory

`provideTanStackQuery` registers the factory with Angular's `useFactory`. It runs once per root injector and in an injection context, so it can call `inject()`. Browser- and server-specific query defaults can stay inside this factory.

Angular Query runs its query work outside `NgZone`, so background cache timers do not delay server rendering. Pending queries and mutations still participate in Angular's stability tracking. Server clients default to no retries and `gcTime: Infinity`; explicit client defaults are preserved.

If you call `QueryClient` directly during rendering with a finite `gcTime`, run that work outside `NgZone` too. Await it or use Angular's `PendingTasks` when the HTML needs its result.

```ts
import { isPlatformBrowser } from '@angular/common'
import { inject, PLATFORM_ID } from '@angular/core'
import { QueryClient } from '@tanstack/angular-query'

export function createQueryClient() {
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID))

  return new QueryClient({
    defaultOptions: {
      queries: {
        // Keep hydrated data fresh briefly to avoid an immediate browser refetch.
        staleTime: isBrowser ? 60_000 : 0,
      },
    },
  })
}
```

## Browser config

Use the factory with `provideTanStackQuery` in your application config. Angular's HTTP transfer
cache is enabled by default with
[`provideClientHydration`](https://angular.dev/api/platform-browser/provideClientHydration). Add
[`withNoHttpTransferCache`](https://angular.dev/api/platform-browser/withNoHttpTransferCache) so
query results are not serialized once by each cache.

```ts
import type { ApplicationConfig } from '@angular/core'
import { provideHttpClient } from '@angular/common/http'
import {
  provideClientHydration,
  withEventReplay,
  withNoHttpTransferCache,
} from '@angular/platform-browser'
import { provideTanStackQuery } from '@tanstack/angular-query'
import { withDevtools } from '@tanstack/angular-query-devtools'
import { createQueryClient } from './query-client'

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideClientHydration(withEventReplay(), withNoHttpTransferCache()),
    provideTanStackQuery(createQueryClient, withDevtools()),
  ],
}
```

## Server config

Merge the application config with `provideServerRendering` in the server config.

```ts
import { mergeApplicationConfig } from '@angular/core'
import { provideServerRendering, withRoutes } from '@angular/ssr'
import { appConfig } from './app.config'
import { serverRoutes } from './app.routes.server'

export const serverConfig = mergeApplicationConfig(appConfig, {
  providers: [provideServerRendering(withRoutes(serverRoutes))],
})
```

## Multiple query clients

Built-in hydration uses a default transfer key. For a second `QueryClient` in a child injector, pass a distinct key with `withHydrationKey` so each client's serialized cache stays separate.

```ts
providers: [
  provideTanStackQuery(
    createSecondaryQueryClient,
    withHydrationKey('my-secondary-query-cache'),
  ),
]
```

## Disabling built-in hydration

If you need to opt out of TanStack Query's built-in `TransferState` integration for a specific injector, add `withNoQueryHydration()`.

```ts
providers: [provideTanStackQuery(createQueryClient, withNoQueryHydration())]
```

## See also

- [Angular HttpClient and data fetching](../angular-httpclient-and-other-data-fetching-clients.md)
- [Devtools](../devtools.md)
