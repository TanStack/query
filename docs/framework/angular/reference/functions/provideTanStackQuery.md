---
id: provideTanStackQuery
title: provideTanStackQuery
---

```ts
function provideTanStackQuery(queryClient, ...features): Provider[];
```

Defined in: [providers.ts:102](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L102)

Sets up providers necessary to enable TanStack Query functionality for Angular applications. Allows
configuring a `QueryClient` and optional features such as developer tools.

## Parameters

### queryClient

A `QueryClient` instance, or an `InjectionToken` which provides a `QueryClient`.

`QueryClient` | `InjectionToken`\<`QueryClient`\>

### features

...[`QueryFeatures`](../type-aliases/QueryFeatures.md)[]

Optional features to configure additional Query functionality.

## Returns

`Provider`[]

A set of providers to set up TanStack Query.

## See

 - https://tanstack.com/query/v5/docs/framework/angular/quick-start
 - withDevtools

## Examples

```ts
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental'

bootstrapApplication(AppComponent, {
  providers: [provideTanStackQuery(new QueryClient())],
})
```

The same, in an `NgModule`-based application:
```ts
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental'

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  providers: [provideTanStackQuery(new QueryClient())],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

Enabling optional developer tools by adding `withDevtools` — by default, the tools are then loaded when
your app is in development mode:
```ts
import {
  provideTanStackQuery,
  withDevtools,
  QueryClient,
} from '@tanstack/angular-query-experimental'

bootstrapApplication(AppComponent, {
  providers: [provideTanStackQuery(new QueryClient(), withDevtools())],
})
```

Using an `InjectionToken` for the `QueryClient` — an advanced optimization that lets TanStack Query be
absent from the main application bundle, useful for including it on lazy-loaded routes only while still
sharing a `QueryClient`. This is a small optimization; for most applications it's preferable to provide
the `QueryClient` in the main application config, as in the examples above:
```ts
export const MY_QUERY_CLIENT = new InjectionToken('', {
  factory: () => new QueryClient(),
})

// In a lazy loaded route or lazy loaded component's providers array:
providers: [provideTanStackQuery(MY_QUERY_CLIENT)]
```
