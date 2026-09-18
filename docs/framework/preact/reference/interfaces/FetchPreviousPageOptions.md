---
id: FetchPreviousPageOptions
title: FetchPreviousPageOptions
---

Defined in: [packages/query-core/src/types.ts:761](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L761)

## Extends

- [`ResultOptions`](ResultOptions.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="cancelrefetch"></a> `cancelRefetch?` | `boolean` | If set to `true`, calling `fetchPreviousPage` repeatedly will invoke `queryFn` every time, whether the previous invocation has resolved or not. Also, the result from previous invocations will be ignored. If set to `false`, calling `fetchPreviousPage` repeatedly won't have any effect until the first invocation has resolved. Defaults to `true`. |
| <a id="throwonerror"></a> `throwOnError?` | `boolean` | If set to `true`, the method throws if any of the underlying query refetch tasks fail. Defaults to `false`, in which case failed refetches are swallowed and not surfaced to the caller. |
