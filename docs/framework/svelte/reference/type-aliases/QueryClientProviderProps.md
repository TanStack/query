---
id: QueryClientProviderProps
title: QueryClientProviderProps
---

```ts
type QueryClientProviderProps = {
  children: Snippet;
  client: QueryClient;
};
```

Defined in: [packages/svelte-query/src/types.ts:198](https://github.com/TanStack/query/blob/main/packages/svelte-query/src/types.ts#L198)

The props accepted by `QueryClientProvider`.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-children"></a> `children` | `Snippet` | The children that can use the provided `QueryClient`. |
| <a id="property-client"></a> `client` | [`QueryClient`](../classes/QueryClient.md) | The `QueryClient` to provide to the children. |
