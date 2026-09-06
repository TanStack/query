---
id: TimeoutProvider
title: TimeoutProvider
---

```ts
type TimeoutProvider<TTimerId> = object;
```

Defined in: packages/query-core/dist-ts/src/timeoutManager.d.ts:22

Backend for timer functions.

## Type Parameters

### TTimerId

`TTimerId` *extends* [`ManagedTimerId`](ManagedTimerId.md) = [`ManagedTimerId`](ManagedTimerId.md)

## Properties

### clearInterval()

```ts
readonly clearInterval: (intervalId) => void;
```

Defined in: packages/query-core/dist-ts/src/timeoutManager.d.ts:26

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

Defined in: packages/query-core/dist-ts/src/timeoutManager.d.ts:24

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

Defined in: packages/query-core/dist-ts/src/timeoutManager.d.ts:25

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

Defined in: packages/query-core/dist-ts/src/timeoutManager.d.ts:23

#### Parameters

##### callback

[`TimeoutCallback`](TimeoutCallback.md)

##### delay

`number`

#### Returns

`TTimerId`
