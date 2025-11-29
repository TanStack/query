---
id: TimeoutCallback
title: TimeoutCallback
---

# Type Alias: TimeoutCallback()

```ts
type TimeoutCallback = (_) => void;
```

Defined in: [packages/query-core/src/timeoutManager.ts:9](https://github.com/TanStack/query/blob/main/packages/query-core/src/timeoutManager.ts#L9)

TimeoutManager does not support passing arguments to the callback.

`(_: void)` is the argument type inferred by TypeScript's default typings for
`setTimeout(cb, number)`.
If we don't accept a single void argument, then
`new Promise(resolve => timeoutManager.setTimeout(resolve, N))` is a type error.

## Parameters

### \_

`void`

## Returns

`void`
