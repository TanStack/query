---
id: TimeoutCallback
title: TimeoutCallback
---

```ts
type TimeoutCallback = (_) => void;
```

Defined in: packages/query-core/dist-ts/src/timeoutManager.d.ts:9

[TimeoutManager](../interfaces/TimeoutManager.md) does not support passing arguments to the callback.

`(_: void)` is the argument type inferred by TypeScript's default typings for
`setTimeout(cb, number)`.
If we don't accept a single void argument, then
`new Promise(resolve => timeoutManager.setTimeout(resolve, N))` is a type error.

## Parameters

### \_

`void`

## Returns

`void`
