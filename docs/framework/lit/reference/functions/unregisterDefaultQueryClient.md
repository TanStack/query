---
id: unregisterDefaultQueryClient
title: unregisterDefaultQueryClient
---

```ts
function unregisterDefaultQueryClient(client: QueryClient): void;
```

Defined in: [packages/lit-query/src/context.ts:43](https://github.com/TanStack/query/blob/main/packages/lit-query/src/context.ts#L43)

Unregisters a client previously registered with
`registerDefaultQueryClient`.

`QueryClientProvider` calls this automatically when it disconnects.

## Parameters

### client

[`QueryClient`](../classes/QueryClient.md)

The query client registration to release.

## Returns

`void`
