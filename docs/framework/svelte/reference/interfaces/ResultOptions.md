---
id: ResultOptions
title: ResultOptions
---

Defined in: [packages/query-core/src/types.ts:706](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L706)

## Extended by

- [`RefetchOptions`](RefetchOptions.md)
- [`FetchNextPageOptions`](FetchNextPageOptions.md)
- [`FetchPreviousPageOptions`](FetchPreviousPageOptions.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="throwonerror"></a> `throwOnError?` | `boolean` | If set to `true`, the method throws if any of the underlying query refetch tasks fail. Defaults to `false`, in which case failed refetches are swallowed and not surfaced to the caller. |
