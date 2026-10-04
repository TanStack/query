---
id: isCancelledError
title: isCancelledError
---

```ts
function isCancelledError(value: any): value is CancelledError;
```

Defined in: [packages/query-core/src/retryer.ts:136](https://github.com/TanStack/query/blob/main/packages/query-core/src/retryer.ts#L136)

Checks whether a value is a `CancelledError`.

## Parameters

### value

`any`

The value to check.

## Returns

`value is CancelledError`

`true` if `value` is a `CancelledError`.

## Deprecated

Use instanceof `CancelledError` instead.
