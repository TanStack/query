---
id: provideAngularQuery
title: provideAngularQuery
---

# Function: provideAngularQuery()

```ts
function provideAngularQuery(queryClient): EnvironmentProviders
```

Sets up providers necessary to enable TanStack Query functionality for Angular applications.

Allows to configure a `QueryClient`.

**Example - standalone**

```ts
import {
  provideAngularQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental'

bootstrapApplication(AppComponent, {
  providers: [provideAngularQuery(new QueryClient())],
})
```

**Example - NgModule-based**

```ts
import {
  provideAngularQuery,
  QueryClient,
} from '@tanstack/angular-query-experimental'

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule],
  providers: [provideAngularQuery(new QueryClient())],
  bootstrap: [AppComponent],
})
export class AppModule {}
```

## Parameters

• **queryClient**: `QueryClient`

A `QueryClient` instance.

## Returns

`EnvironmentProviders`

A set of providers to set up TanStack Query.

## See

https://tanstack.com/query/v5/docs/framework/angular/quick-start

## Defined in

[providers.ts:50](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/angular-query-experimental/src/providers.ts#L50)
