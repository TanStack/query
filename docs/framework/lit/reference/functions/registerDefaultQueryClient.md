---
id: registerDefaultQueryClient
title: registerDefaultQueryClient
---

# Function: registerDefaultQueryClient()

```ts
function registerDefaultQueryClient(client): void;
```

Defined in: [packages/lit-query/src/context.ts:32](https://github.com/TanStack/query/blob/main/packages/lit-query/src/context.ts#L32)

Registers a `QueryClient` as a process-local fallback for APIs that resolve a
client without an explicit argument.

`QueryClientProvider` calls this automatically while it is connected. Prefer
passing an explicit client or rendering under a provider when possible.

## Parameters

### client

`QueryClient`

The query client to register as the current default.

## Returns

`void`
