---
id: TimeoutManager
title: TimeoutManager
---

Defined in: [packages/query-core/src/timeoutManager.ts:70](https://github.com/TanStack/query/blob/main/packages/query-core/src/timeoutManager.ts#L70)

Allows customization of how timeouts are created.

@tanstack/query-core makes liberal use of timeouts to implement `staleTime`
and `gcTime`. The default TimeoutManager provider uses the platform's global
`setTimeout` implementation, which is known to have scalability issues with
thousands of timeouts on the event loop.

If you hit this limitation, consider providing a custom TimeoutProvider that
coalesces timeouts.

## Implements

- `Omit`\<[`TimeoutProvider`](../type-aliases/TimeoutProvider.md), `"name"`\>

## Methods

### clearInterval()

```ts
clearInterval(intervalId): void;
```

Defined in: [packages/query-core/src/timeoutManager.ts:224](https://github.com/TanStack/query/blob/main/packages/query-core/src/timeoutManager.ts#L224)

`clearInterval` can be used to cancel an interval, like the global
`clearInterval` function. It should be called with an interval ID
returned by `setInterval`.

#### Parameters

##### intervalId

[`ManagedTimerId`](../type-aliases/ManagedTimerId.md) | `undefined`

#### Returns

`void`

#### Example

```ts
import { timeoutManager } from '@tanstack/query-core'

const intervalId = timeoutManager.setInterval(
  () => console.log('ran at:', new Date()),
  1000,
)

timeoutManager.clearInterval(intervalId)
```

#### Implementation of

[`TimeoutProvider`](../type-aliases/TimeoutProvider.md).[`clearInterval`](../type-aliases/TimeoutProvider.md#clearinterval)

***

### clearTimeout()

```ts
clearTimeout(timeoutId): void;
```

Defined in: [packages/query-core/src/timeoutManager.ts:179](https://github.com/TanStack/query/blob/main/packages/query-core/src/timeoutManager.ts#L179)

`clearTimeout` cancels a timeout callback scheduled with `setTimeout`,
like the global `clearTimeout` function. It should be called with a
timer ID returned by `setTimeout`.

#### Parameters

##### timeoutId

[`ManagedTimerId`](../type-aliases/ManagedTimerId.md) | `undefined`

#### Returns

`void`

#### Example

```ts
import { timeoutManager } from '@tanstack/query-core'

const timeoutId = timeoutManager.setTimeout(
  () => console.log('ran at:', new Date()),
  1000,
)

timeoutManager.clearTimeout(timeoutId)
```

#### Implementation of

[`TimeoutProvider`](../type-aliases/TimeoutProvider.md).[`clearTimeout`](../type-aliases/TimeoutProvider.md#cleartimeout)

***

### setInterval()

```ts
setInterval(callback, delay): ManagedTimerId;
```

Defined in: [packages/query-core/src/timeoutManager.ts:200](https://github.com/TanStack/query/blob/main/packages/query-core/src/timeoutManager.ts#L200)

`setInterval` schedules a callback to be called approximately every
`delay` milliseconds, like the global `setInterval` function.

Like `setTimeout`, it returns a timer ID, which may be a number or an
object that can be coerced to a number via `Symbol.toPrimitive`.

#### Parameters

##### callback

[`TimeoutCallback`](../type-aliases/TimeoutCallback.md)

##### delay

`number`

#### Returns

[`ManagedTimerId`](../type-aliases/ManagedTimerId.md)

#### Example

```ts
import { timeoutManager } from '@tanstack/query-core'

const intervalId = timeoutManager.setInterval(
  () => console.log('ran at:', new Date()),
  1000,
)
```

#### Implementation of

[`TimeoutProvider`](../type-aliases/TimeoutProvider.md).[`setInterval`](../type-aliases/TimeoutProvider.md#setinterval)

***

### setTimeout()

```ts
setTimeout(callback, delay): ManagedTimerId;
```

Defined in: [packages/query-core/src/timeoutManager.ts:155](https://github.com/TanStack/query/blob/main/packages/query-core/src/timeoutManager.ts#L155)

`setTimeout` schedules a callback to run after approximately `delay`
milliseconds, like the global `setTimeout` function. The callback can be
canceled with `clearTimeout`.

It returns a timer ID, which may be a number or an object that can be
coerced to a number via `Symbol.toPrimitive`.

#### Parameters

##### callback

[`TimeoutCallback`](../type-aliases/TimeoutCallback.md)

##### delay

`number`

#### Returns

[`ManagedTimerId`](../type-aliases/ManagedTimerId.md)

#### Example

```ts
import { timeoutManager } from '@tanstack/query-core'

const timeoutId = timeoutManager.setTimeout(
  () => console.log('ran at:', new Date()),
  1000,
)

const timeoutIdNumber: number = Number(timeoutId)
```

#### Implementation of

[`TimeoutProvider`](../type-aliases/TimeoutProvider.md).[`setTimeout`](../type-aliases/TimeoutProvider.md#settimeout)

***

### setTimeoutProvider()

```ts
setTimeoutProvider<TTimerId>(provider): void;
```

Defined in: [packages/query-core/src/timeoutManager.ts:106](https://github.com/TanStack/query/blob/main/packages/query-core/src/timeoutManager.ts#L106)

`setTimeoutProvider` can be used to set a custom implementation of the
`setTimeout`, `clearTimeout`, `setInterval`, `clearInterval` functions,
called a `TimeoutProvider`.

This may be useful if you notice event loop performance issues with
thousands of queries. A custom TimeoutProvider could also support timer
delays longer than the global `setTimeout` maximum delay value of about
24 days.

It is important to call `setTimeoutProvider` before creating a
QueryClient or queries, so that the same provider is used consistently
for all timers in the application, since different TimeoutProviders
cannot cancel each others' timers.

#### Type Parameters

##### TTimerId

`TTimerId` *extends* [`ManagedTimerId`](../type-aliases/ManagedTimerId.md)

#### Parameters

##### provider

[`TimeoutProvider`](../type-aliases/TimeoutProvider.md)\<`TTimerId`\>

#### Returns

`void`

#### Example

```ts
import { timeoutManager, QueryClient } from '@tanstack/query-core'
import { CustomTimeoutProvider } from './CustomTimeoutProvider'

timeoutManager.setTimeoutProvider(new CustomTimeoutProvider())

export const queryClient = new QueryClient()
```
