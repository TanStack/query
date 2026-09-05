---
id: provideAngularQuery
title: provideAngularQuery
---

```ts
function provideAngularQuery(queryClient): Provider[];
```

Defined in: [providers.ts:121](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L121)

Sets up providers necessary to enable TanStack Query functionality for Angular applications.

Allows configuring a `QueryClient`.

## Parameters

### queryClient

`QueryClient`

A `QueryClient` instance.

## Returns

`Provider`[]

A set of providers to set up TanStack Query.

## See

https://tanstack.com/query/v5/docs/framework/angular/quick-start

## Deprecated

Use `provideTanStackQuery` instead.
