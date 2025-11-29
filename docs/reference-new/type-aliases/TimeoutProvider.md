---
id: TimeoutProvider
title: TimeoutProvider
---

# Type Alias: TimeoutProvider\<TTimerId\>

```ts
type TimeoutProvider<TTimerId> = object;
```

Defined in: [packages/query-core/src/timeoutManager.ts:22](https://github.com/TanStack/query/blob/main/packages/query-core/src/timeoutManager.ts#L22)

Backend for timer functions.

## Type Parameters

### TTimerId

`TTimerId` *extends* [`ManagedTimerId`](ManagedTimerId.md) = [`ManagedTimerId`](ManagedTimerId.md)

## Properties

### clearInterval()

```ts
readonly clearInterval: (intervalId) => void;
```

Defined in: [packages/query-core/src/timeoutManager.ts:28](https://github.com/TanStack/query/blob/main/packages/query-core/src/timeoutManager.ts#L28)

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

Defined in: [packages/query-core/src/timeoutManager.ts:25](https://github.com/TanStack/query/blob/main/packages/query-core/src/timeoutManager.ts#L25)

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

Defined in: [packages/query-core/src/timeoutManager.ts:27](https://github.com/TanStack/query/blob/main/packages/query-core/src/timeoutManager.ts#L27)

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

Defined in: [packages/query-core/src/timeoutManager.ts:24](https://github.com/TanStack/query/blob/main/packages/query-core/src/timeoutManager.ts#L24)

#### Parameters

##### callback

[`TimeoutCallback`](TimeoutCallback.md)

##### delay

`number`

#### Returns

`TTimerId`
