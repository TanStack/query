---
id: CancelOptions
title: CancelOptions
---

Defined in: [packages/query-core/src/types.ts:2396](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L2396)

Options for cancelling an in-flight fetch, e.g. via `query.cancel()`.
They are carried on the [CancelledError](../classes/CancelledError.md) that the cancelled fetch rejects with.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-revert"></a> `revert?` | `boolean` | If `true`, the query goes back to the state it had before the fetch started, instead of getting the cancellation error. |
| <a id="property-silent"></a> `silent?` | `boolean` | If `true`, the cancellation error isn't surfaced, e.g. because another fetch replaces the cancelled one. |
