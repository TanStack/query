---
id: isCancelledError
title: isCancelledError
---

```ts
function isCancelledError(value: any): value is CancelledError;
```

Defined in: [packages/query-core/src/retryer.ts:106](https://github.com/TanStack/query/blob/main/packages/query-core/src/retryer.ts#L106)

## Parameters

### value

`any`

The value to check.

## Returns

`value is CancelledError`

`true` if `value` is a `CancelledError`.

## Deprecated

Use instanceof `CancelledError` instead.
