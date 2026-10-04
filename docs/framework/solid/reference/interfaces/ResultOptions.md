---
id: ResultOptions
title: ResultOptions
---

Defined in: [packages/query-core/src/types.ts:839](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L839)

Options shared by the `QueryClient` and observer methods that refetch queries, controlling
whether a failed refetch makes the returned promise reject.

## Extended by

- [`RefetchOptions`](RefetchOptions.md)
- [`FetchNextPageOptions`](FetchNextPageOptions.md)
- [`FetchPreviousPageOptions`](FetchPreviousPageOptions.md)

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-throwonerror"></a> `throwOnError?` | `boolean` | `false` | If set to `true`, the method throws if any of the underlying query refetch tasks fail. If set to `false`, failed refetches are swallowed and not surfaced to the caller. |
