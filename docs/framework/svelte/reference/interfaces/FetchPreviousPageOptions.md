---
id: FetchPreviousPageOptions
title: FetchPreviousPageOptions
---

Defined in: [packages/query-core/src/types.ts:805](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L805)

## Extends

- [`ResultOptions`](ResultOptions.md)

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="cancelrefetch"></a> `cancelRefetch?` | `boolean` | `true` | If set to `true`, calling `fetchPreviousPage` repeatedly will invoke `queryFn` every time, whether the previous invocation has resolved or not. Also, the result from previous invocations will be ignored. If set to `false`, calling `fetchPreviousPage` repeatedly won't have any effect until the first invocation has resolved. |
| <a id="throwonerror"></a> `throwOnError?` | `boolean` | `false` | If set to `true`, the method throws if any of the underlying query refetch tasks fail. If set to `false`, failed refetches are swallowed and not surfaced to the caller. |
