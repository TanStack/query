---
id: provideQueryClient
title: provideQueryClient
---

# Function: provideQueryClient()

```ts
function provideQueryClient(queryClient): EnvironmentProviders;
```

Defined in: [providers.ts:79](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/providers.ts#L79)

Usually [provideTanStackQuery](provideTanStackQuery.md) is used once to set up TanStack Query and the
[https://tanstack.com/query/latest/docs/reference/QueryClient\|QueryClient](https://tanstack.com/query/latest/docs/reference/QueryClient|QueryClient)
for the entire application. Internally it calls `provideQueryClient`.
You can use `provideQueryClient` to provide a different `QueryClient` instance for a part
of the application or for unit testing purposes.

## Parameters

### queryClient

A `QueryClient` instance, or an `InjectionToken` which provides a `QueryClient`.

`QueryClient` | `InjectionToken`\<`QueryClient`\>

## Returns

`EnvironmentProviders`

A single EnvironmentProviders value to add to environment `providers` (do not spread).
