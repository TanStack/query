---
id: provideQueryClient
title: provideQueryClient
---

# Function: provideQueryClient()

```ts
function provideQueryClient(queryClient): object
```

Usually [provideTanStackQuery](providetanstackquery.md) is used once to set up TanStack Query and the
[https://tanstack.com/query/latest/docs/reference/QueryClient\|QueryClient](https://tanstack.com/query/latest/docs/reference/QueryClient|QueryClient)
for the entire application. You can use `provideQueryClient` to provide a
different `QueryClient` instance for a part of the application.

## Parameters

### queryClient

`QueryClient`

the `QueryClient` instance to provide.

## Returns

`object`

### provide

```ts
provide: typeof QueryClient = QueryClient;
```

### useValue

```ts
useValue: QueryClient = queryClient
```

## Defined in

[providers.ts:32](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L32)
