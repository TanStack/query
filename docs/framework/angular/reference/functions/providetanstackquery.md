---
id: provideTanStackQuery
title: provideTanStackQuery
---

# Function: provideTanStackQuery()

```ts
function provideTanStackQuery(queryClient, ...features): Provider[]
```

Sets up providers necessary to enable TanStack Query functionality for Angular applications.

Allows to configure a `QueryClient` and optional features such as developer tools.

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

You can also enable optional developer tools by adding `withDevtools`. By
default the tools will then be loaded when your app is in development mode.

```ts
import {
  provideTanStackQuery,
  withDevtools
  QueryClient,
} from '@tanstack/angular-query-experimental'

bootstrapApplication(AppComponent,
  {
    providers: [
      provideTanStackQuery(new QueryClient(), withDevtools())
    ]
  }
)
```

**Example: using an InjectionToken**

```ts
export const MY_QUERY_CLIENT = new InjectionToken('', {
  factory: () => new QueryClient(),
})

// In a lazy loaded route or lazy loaded component's providers array:
providers: [provideTanStackQuery(MY_QUERY_CLIENT)]
```

## Parameters

### queryClient

A `QueryClient` instance, or an `InjectionToken` which provides a `QueryClient`.

`QueryClient` | `InjectionToken`\<`QueryClient`\>

### features

...[`QueryFeatures`](../../type-aliases/queryfeatures.md)[]

Optional features to configure additional Query functionality.

## Returns

`Provider`[]

A set of providers to set up TanStack Query.

## See

- https://tanstack.com/query/v5/docs/framework/angular/quick-start
- withDevtools

## Defined in

[providers.ts:118](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L118)
