---
id: useQueryClient
title: useQueryClient
---

# Function: useQueryClient()

```ts
function useQueryClient(): QueryClient;
```

Defined in: [packages/lit-query/src/context.ts:98](https://github.com/TanStack/query/blob/main/packages/lit-query/src/context.ts#L98)

Resolves the current default `QueryClient` registered by a connected
`QueryClientProvider`.

This helper is useful outside a Lit reactive controller when a single
provider is mounted. It throws if no client is registered or if multiple
clients are mounted and the default would be ambiguous.

## Returns

`QueryClient`

The single registered query client.
