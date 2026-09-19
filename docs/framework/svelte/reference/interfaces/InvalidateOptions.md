---
id: InvalidateOptions
title: InvalidateOptions
---

Defined in: [packages/query-core/src/types.ts:790](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L790)

## Extends

- [`RefetchOptions`](RefetchOptions.md)

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="cancelrefetch"></a> `cancelRefetch?` | `boolean` | `true` | If set to `true`, a currently running request will be cancelled before a new request is made If set to `false`, no refetch will be made if there is already a request running. |
| <a id="throwonerror"></a> `throwOnError?` | `boolean` | `false` | If set to `true`, the method throws if any of the underlying query refetch tasks fail. If set to `false`, failed refetches are swallowed and not surfaced to the caller. |
