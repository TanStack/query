---
id: provideQueryClient
title: provideQueryClient
---

# Function: provideQueryClient()

```ts
function provideQueryClient(queryClient): Provider;
```

Defined in: [providers.ts:14](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L14)

Usually [provideTanStackQuery](../provideTanStackQuery.md) is used once to set up TanStack Query and the
[https://tanstack.com/query/latest/docs/reference/QueryClient\|QueryClient](https://tanstack.com/query/latest/docs/reference/QueryClient|QueryClient)
for the entire application. Internally it calls `provideQueryClient`.
You can use `provideQueryClient` to provide a different `QueryClient` instance for a part
of the application or for unit testing purposes.

## Parameters

### queryClient

A `QueryClient` instance, or an `InjectionToken` which provides a `QueryClient`.

`QueryClient` | `InjectionToken`\<`QueryClient`\>

## Returns

`Provider`

a provider object that can be used to provide the `QueryClient` instance.
