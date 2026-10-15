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

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-clearinterval"></a> `clearInterval` | `readonly` | (`intervalId`: `TTimerId` \| `undefined`) => `void` | Cancels an interval scheduled with `setInterval`. |
| <a id="property-cleartimeout"></a> `clearTimeout` | `readonly` | (`timeoutId`: `TTimerId` \| `undefined`) => `void` | Cancels a timeout scheduled with `setTimeout`. |
| <a id="property-setinterval"></a> `setInterval` | `readonly` | (`callback`: [`TimeoutCallback`](TimeoutCallback.md), `delay`: `number`) => `TTimerId` | Schedules `callback` to run every `delay` milliseconds, like the global `setInterval`. |
| <a id="property-settimeout"></a> `setTimeout` | `readonly` | (`callback`: [`TimeoutCallback`](TimeoutCallback.md), `delay`: `number`) => `TTimerId` | Schedules `callback` to run once after `delay` milliseconds, like the global `setTimeout`. |
