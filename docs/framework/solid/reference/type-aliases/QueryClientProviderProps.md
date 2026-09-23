---
id: QueryClientProviderProps
title: QueryClientProviderProps
---

```ts
type QueryClientProviderProps = object;
```

Defined in: [packages/solid-query/src/QueryClientProvider.tsx:63](https://github.com/TanStack/query/blob/main/packages/solid-query/src/QueryClientProvider.tsx#L63)

The props accepted by `QueryClientProvider`.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="children"></a> `children?` | `JSX.Element` | The components that get access to the provided `QueryClient`. |
| <a id="client"></a> `client` | [`QueryClient`](../classes/QueryClient.md) | **Required** The `QueryClient` instance to provide. |
