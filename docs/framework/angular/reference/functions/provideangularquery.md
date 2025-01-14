---
id: provideAngularQuery
title: provideAngularQuery
---

# Function: ~~provideAngularQuery()~~

```ts
function provideAngularQuery(queryClient): EnvironmentProviders
```

Sets up providers necessary to enable TanStack Query functionality for Angular applications.

Allows to configure a `QueryClient`.

## Parameters

### queryClient

`QueryClient`

A `QueryClient` instance.

## Returns

`EnvironmentProviders`

A set of providers to set up TanStack Query.

## See

https://tanstack.com/query/v5/docs/framework/angular/quick-start

## Deprecated

Use `provideTanStackQuery` instead.

## Defined in

[providers.ts:125](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L125)
