---
id: provideTanStackQuery
title: provideTanStackQuery
---

```ts
function provideTanStackQuery(queryClientFactory, ...features): EnvironmentProviders;
```

Defined in: [packages/angular-query/src/providers.ts:99](https://github.com/TanStack/query/blob/main/packages/angular-query/src/providers.ts#L99)

Provides a `QueryClient` and optional TanStack Query features.
The factory runs once per injector in Angular's injection context, so it can
call `inject()` and each SSR request can receive an independent cache.

**Example - standalone**

```ts
import {
  provideTanStackQuery,
  QueryClient,
} from '@tanstack/angular-query'

bootstrapApplication(AppComponent, {
  providers: [provideTanStackQuery(() => new QueryClient())],
})
```

You can also enable optional developer tools by adding `withDevtools`. By
default the tools will then be loaded when your app is in development mode.

```ts
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query'
import { withDevtools } from '@tanstack/angular-query-devtools'

bootstrapApplication(AppComponent, {
  providers: [
    provideTanStackQuery(() => new QueryClient(), withDevtools()),
  ],
})
```

Resolve an existing token inside the factory when another provider owns client creation:

```ts
export const MY_QUERY_CLIENT = new InjectionToken('', {
  factory: () => new QueryClient(),
})

providers: [provideTanStackQuery(() => inject(MY_QUERY_CLIENT))]
```

## Parameters

### queryClientFactory

Creates or resolves a `QueryClient` in the injection context.

() => `QueryClient`

### features

...readonly [`QueryFeature`](../interfaces/QueryFeature.md)[]

Optional features to configure additional Query functionality.

## Returns

`EnvironmentProviders`

A single EnvironmentProviders value (do not spread into `providers`).

## See

 - https://tanstack.com/query/v5/docs/framework/angular/quick-start
 - https://tanstack.com/query/v5/docs/framework/angular/devtools
 - https://tanstack.com/query/latest/docs/framework/angular/guides/ssr
