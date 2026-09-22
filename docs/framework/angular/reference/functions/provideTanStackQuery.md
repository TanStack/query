---
id: provideTanStackQuery
title: provideTanStackQuery
---

```ts
function provideTanStackQuery(queryClientFactory: () => QueryClient, ...features: readonly QueryFeature[]): EnvironmentProviders;
```

Defined in: [packages/angular-query/src/providers.ts:102](https://github.com/TanStack/query/blob/main/packages/angular-query/src/providers.ts#L102)

Provides a `QueryClient` and optional TanStack Query features.
The factory runs once per injector in Angular's injection context, so it can
call `inject()` and each SSR request can receive an independent cache.

**Example - standalone**

## Parameters

### queryClientFactory

() => [`QueryClient`](../classes/QueryClient.md)

Creates or resolves a `QueryClient` in the injection context.

### features

...readonly [`QueryFeature`](../interfaces/QueryFeature.md)[]

Optional features to configure additional Query functionality.

## Returns

`EnvironmentProviders`

A single EnvironmentProviders value (do not spread into `providers`).

## Example

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

## See

 - https://tanstack.com/query/v5/docs/framework/angular/quick-start
 - https://tanstack.com/query/v5/docs/framework/angular/devtools
 - https://tanstack.com/query/latest/docs/framework/angular/guides/ssr
