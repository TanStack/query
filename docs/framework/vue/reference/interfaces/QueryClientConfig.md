---
id: QueryClientConfig
title: QueryClientConfig
---

Defined in: [packages/query-core/src/types.ts:1512](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1512)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="defaultoptions"></a> `defaultOptions?` | [`DefaultOptions`](DefaultOptions.md)\<`Error`\> | Default options for all queries and mutations created through this client. |
| <a id="mutationcache"></a> `mutationCache?` | `MutationCache` | The mutation cache this client is connected to. A new `MutationCache` is created if not provided. |
| <a id="querycache"></a> `queryCache?` | `QueryCache` | The query cache this client is connected to. A new `QueryCache` is created if not provided. |
