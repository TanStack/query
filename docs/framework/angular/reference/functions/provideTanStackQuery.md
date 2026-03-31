---
id: provideTanStackQuery
title: provideTanStackQuery
---

# Function: provideTanStackQuery()

```ts
function provideTanStackQuery(queryClient, ...features): EnvironmentProviders;
```

Defined in: [providers.ts:124](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L124)

Sets up providers necessary to enable TanStack Query functionality for Angular applications.

Allows to configure a `QueryClient` and optional features such as developer tools. SSR dehydration and client hydration are built in (see the [SSR guide](../../guides/ssr.md)); you do not need a separate hydration feature.

**Environment injector only:** use this with `bootstrapApplication`, `ApplicationConfig`, `NgModule.providers`, `mergeApplicationConfig`, or route-level providers. Do **not** use it in [`@Component({ providers })`](https://angular.dev/api/core/Component#providers).

**Example - standalone**

```ts
import {
  provideTanStackQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental'

bootstrapApplication(AppComponent, {
  providers: [provideTanStackQuery(new QueryClient())],
})
```

**Example - NgModule-based**

```ts
import {
  provideTanStackQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental'

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  providers: [provideTanStackQuery(new QueryClient())],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

You can also enable optional developer tools by adding `withDevtools` from `@tanstack/angular-query-devtools` (see the [Angular Devtools guide](../../devtools.md)).

```ts
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental'
import { withDevtools } from '@tanstack/angular-query-devtools'

bootstrapApplication(AppComponent, {
  providers: [provideTanStackQuery(new QueryClient(), withDevtools())],
})
```

**Example: using an InjectionToken**

```ts
export const MY_QUERY_CLIENT = new InjectionToken('', {
  factory: () => new QueryClient(),
})

providers: [provideTanStackQuery(MY_QUERY_CLIENT)]
```

## Parameters

### queryClient

A `QueryClient` instance, or an `InjectionToken` which provides a `QueryClient`.

`QueryClient` | `InjectionToken`\<`QueryClient`\>

### features

...[`QueryFeatures`](../type-aliases/QueryFeatures.md)[]

Optional features to configure additional Query functionality.

## Returns

`EnvironmentProviders`

A single value to place in environment `providers` (do not spread).

## See

 - https://tanstack.com/query/v5/docs/framework/angular/quick-start
 - https://tanstack.com/query/v5/docs/framework/angular/devtools
 - https://tanstack.com/query/latest/docs/framework/angular/guides/ssr
