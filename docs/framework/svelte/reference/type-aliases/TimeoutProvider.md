---
id: TimeoutProvider
title: TimeoutProvider
---

```ts
type TimeoutProvider<TTimerId> = object;
```

Defined in: [packages/query-core/src/timeoutManager.ts:28](https://github.com/TanStack/query/blob/main/packages/query-core/src/timeoutManager.ts#L28)

Backend for timer functions.

Timers are performance-sensitive: short-lived timers (delays under a few seconds) tend to be
latency-sensitive, while long-lived ones may benefit more from coalescing — batching timers
with similar deadlines together — which the default provider (backed by the platform's global
`setTimeout`/`setInterval`) does not do. A custom provider can implement coalescing, and can
also support delays longer than the ~24-day maximum of the global `setTimeout`.

## Type Parameters

### TTimerId

`TTimerId` *extends* [`ManagedTimerId`](ManagedTimerId.md) = [`ManagedTimerId`](ManagedTimerId.md)

## Properties

### clearInterval()

```ts
readonly clearInterval: (intervalId) => void;
```

Defined in: [packages/query-core/src/timeoutManager.ts:34](https://github.com/TanStack/query/blob/main/packages/query-core/src/timeoutManager.ts#L34)

#### Parameters

##### intervalId

`TTimerId` | `undefined`

#### Returns

`void`

***

### clearTimeout()

```ts
readonly clearTimeout: (timeoutId) => void;
```

Defined in: [packages/query-core/src/timeoutManager.ts:31](https://github.com/TanStack/query/blob/main/packages/query-core/src/timeoutManager.ts#L31)

#### Parameters

##### timeoutId

`TTimerId` | `undefined`

#### Returns

`void`

***

### setInterval()

```ts
readonly setInterval: (callback, delay) => TTimerId;
```

Defined in: [packages/query-core/src/timeoutManager.ts:33](https://github.com/TanStack/query/blob/main/packages/query-core/src/timeoutManager.ts#L33)

#### Parameters

##### callback

[`TimeoutCallback`](TimeoutCallback.md)

##### delay

`number`

#### Returns

`TTimerId`

***

### setTimeout()

```ts
readonly setTimeout: (callback, delay) => TTimerId;
```

Defined in: [packages/query-core/src/timeoutManager.ts:30](https://github.com/TanStack/query/blob/main/packages/query-core/src/timeoutManager.ts#L30)

#### Parameters

##### callback

[`TimeoutCallback`](TimeoutCallback.md)

##### delay

`number`

#### Returns

`TTimerId`
