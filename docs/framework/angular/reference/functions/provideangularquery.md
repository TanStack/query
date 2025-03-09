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
} from '@tanstack/angular-query'

bootstrapApplication(AppComponent, {
  providers: [provideAngularQuery(new QueryClient())],
})
```

**Example - NgModule-based**

```ts
import {
  provideAngularQuery,
  QueryClient,
} from '@tanstack/angular-query'

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

[providers.ts:50](https://github.com/TanStack/query/blob/dac5da5416b82b0be38a8fb34dde1fc6670f0a59/packages/angular-query-experimental/src/providers.ts#L50)
