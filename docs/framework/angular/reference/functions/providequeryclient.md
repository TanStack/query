---
id: provideQueryClient
title: provideQueryClient
---

# Function: provideQueryClient()

```ts
function provideQueryClient(value): Provider
```

Usually [provideAngularQuery](provideangularquery.md) is used once to set up TanStack Query and the
[https://tanstack.com/query/latest/docs/reference/QueryClient|QueryClient](https://tanstack.com/query/latest/docs/reference/QueryClient|QueryClient)
for the entire application. You can use `provideQueryClient` to provide a
different `QueryClient` instance for a part of the application.

## Parameters

• **value**: `QueryClient` \| () => `QueryClient`

## Returns

`Provider`

## Defined in

[inject-query-client.ts:25](https://github.com/TanStack/query/blob/dac5da5416b82b0be38a8fb34dde1fc6670f0a59/packages/angular-query-experimental/src/inject-query-client.ts#L25)
