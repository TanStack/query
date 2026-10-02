---
id: CancelOptions
title: CancelOptions
---

Defined in: [packages/query-core/src/types.ts:1639](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1639)

Options for cancelling an in-flight fetch, e.g. via `query.cancel()`.
They are carried on the [CancelledError](../classes/CancelledError.md) that the cancelled fetch rejects with.

## Properties

| Property | Type |
| ------ | ------ |
| <a id="revert"></a> `revert?` | `boolean` |
| <a id="silent"></a> `silent?` | `boolean` |
