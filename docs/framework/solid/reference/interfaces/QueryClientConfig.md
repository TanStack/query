---
id: QueryClientConfig
title: QueryClientConfig
---

Defined in: [packages/solid-query/src/QueryClient.ts:105](https://github.com/TanStack/query/blob/main/packages/solid-query/src/QueryClient.ts#L105)

The config accepted by `new QueryClient(config)`, with Solid's extended [DefaultOptions](DefaultOptions.md).

## Extends

- `QueryClientConfig`

## Properties

| Property | Type | Description | Overrides |
| ------ | ------ | ------ | ------ |
| <a id="defaultoptions"></a> `defaultOptions?` | [`DefaultOptions`](DefaultOptions.md)\<`Error`\> | Default options for all queries and mutations created through this client. | `QueryCoreClientConfig.defaultOptions` |
| <a id="mutationcache"></a> `mutationCache?` | [`MutationCache`](../classes/MutationCache.md) | The mutation cache this client is connected to. A new `MutationCache` is created if not provided. | - |
| <a id="querycache"></a> `queryCache?` | [`QueryCache`](../classes/QueryCache.md) | The query cache this client is connected to. A new `QueryCache` is created if not provided. | - |
