---
id: ResetOptions
title: ResetOptions
---

Defined in: [packages/query-core/src/types.ts:748](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L748)

## Extends

- [`RefetchOptions`](RefetchOptions.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="cancelrefetch"></a> `cancelRefetch?` | `boolean` | If set to `true`, a currently running request will be cancelled before a new request is made If set to `false`, no refetch will be made if there is already a request running. Defaults to `true`. |
| <a id="throwonerror"></a> `throwOnError?` | `boolean` | If set to `true`, the method throws if any of the underlying query refetch tasks fail. Defaults to `false`, in which case failed refetches are swallowed and not surfaced to the caller. |
