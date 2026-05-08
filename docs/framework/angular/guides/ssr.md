---
id: ssr
title: SSR
---

For [Angular SSR](https://angular.dev/guide/ssr), you can run queries on the server, embed the serialized cache in the HTML response, and hydrate the same data in the browser so the client does not refetch immediately.

[`provideTanStackQuery`](../reference/functions/provideTanStackQuery.md) serializes the `QueryClient` cache during SSR and restores it when the browser app boots. This uses Angular's `TransferState` internally.

An end-to-end sample lives at `examples/angular/ssr`. The `examples/angular/ssr-persist` example builds on the same setup with browser persistence.

## Query client token

For SSR, define an `InjectionToken` with a factory and provide that token to `provideTanStackQuery`. This keeps the docs and examples aligned with Angular's DI model and avoids helper-function-based query-client setup.

```ts
import { InjectionToken } from '@angular/core'
import { QueryClient } from '@tanstack/angular-query-experimental'

export const SHARED_QUERY_DEFAULTS = {
  staleTime: 1000 * 30,
  gcTime: 1000 * 60 * 60 * 24,
} as const

export const QUERY_CLIENT = new InjectionToken<QueryClient>('QUERY_CLIENT', {
  factory: () =>
    new QueryClient({
      defaultOptions: {
        queries: {
          ...SHARED_QUERY_DEFAULTS,
        },
      },
    }),
})
```

## Browser config

Use the token with `provideTanStackQuery` in your application config. If you want devtools, import them from the standalone devtools package.

```ts
import type { ApplicationConfig } from '@angular/core'
import { provideHttpClient } from '@angular/common/http'
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser'
import { provideTanStackQuery } from '@tanstack/angular-query-experimental'
import { withDevtools } from '@tanstack/angular-query-devtools'
import { QUERY_CLIENT } from './query-client'

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideClientHydration(withEventReplay()),
    ...provideTanStackQuery(QUERY_CLIENT, withDevtools()),
  ],
}
```

## Server config

Each SSR request should bootstrap a fresh application, and Angular will resolve the token factory in that request-scoped injector. Merge your browser config with `provideServerRendering` in the server config.

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
  ...provideTanStackQuery(
    SECONDARY_QUERY_CLIENT,
    withHydrationKey('my-secondary-query-cache'),
  ),
]
```

## Disabling built-in hydration

If you need to opt out of TanStack Query's built-in `TransferState` integration for a specific injector, add `withNoQueryHydration()`.

```ts
providers: [...provideTanStackQuery(QUERY_CLIENT, withNoQueryHydration())]
```

## See also

- [Angular HttpClient and data fetching](../angular-httpclient-and-other-data-fetching-clients.md)
- [Devtools](../devtools.md)
