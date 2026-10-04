---
id: QueryClientProviderProps
title: QueryClientProviderProps
---

```ts
type QueryClientProviderProps = object;
```

Defined in: [packages/react-query/src/QueryClientProvider.tsx:38](https://github.com/TanStack/query/blob/main/packages/react-query/src/QueryClientProvider.tsx#L38)

The props accepted by `QueryClientProvider`.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="children"></a> `children?` | `React.ReactNode` | The components that get access to the provided `QueryClient`. |
| <a id="client"></a> `client` | [`QueryClient`](../classes/QueryClient.md) | **Required** The `QueryClient` instance to provide. |
