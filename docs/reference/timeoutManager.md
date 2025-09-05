---
id: TimeoutManager
title: TimeoutManager
---

The `TimeoutManager` handles `setTimeout` and `setInterval` timers in TanStack Query.

TanStack Query uses timers to implement features like query `staleTime` and `gcTime`, as well as retries, throttling, and debouncing.

By default, TimeoutManager uses the global `setTimeout` and `setInterval`, but it can be configured to use custom implementations instead.

Its available methods are:

- [`timeoutManager.setTimeoutProvider`](#timeoutmanagersettimeoutprovider)
  - [`TimeoutProvider`](#timeoutprovider)
- [`timeoutManager.setTimeout`](#timeoutmanagersettimeout)
- [`timeoutManager.clearTimeout`](#timeoutmanagercleartimeout)
- [`timeoutManager.setInterval`](#timeoutmanagersetinterval)
- [`timeoutManager.clearInterval`](#timeoutmanagerclearinterval)

## `timeoutManager.setTimeoutProvider`

`setTimeoutProvider` can be used to set a custom implementation of the `setTimeout`, `clearTimeout`, `setInterval`, `clearInterval` functions, called a `TimeoutProvider`.

This may be useful if you notice event loop performance issues with thousands of queries. A custom TimeoutProvider could also support timer delays longer than the global `setTimeout` maximum delay value of about [24 days](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#maximum_delay_value).

It is important to call `setTimeoutProvider` before creating a QueryClient or queries, so that the same provider is used consistently for all timers in the application, since different TimeoutProviders cannot cancel each others' timers.

```tsx
import { timeoutManager, QueryClient } from '@tanstack/react-query'
import { CustomTimeoutProvider } from './CustomTimeoutProvider'

timeoutManager.setTimeoutProvider(new CustomTimeoutProvider())

export const queryClient = new QueryClient()
```

### `TimeoutProvider`

Timers are very performance sensitive. Short term timers (such as those with delays less than 5 seconds) tend to be latency sensitive, where long-term timers may benefit more from [timer coalescing](https://en.wikipedia.org/wiki/Timer_coalescing) - batching timers with similar deadlines together - using a data structure like a [hierarchical time wheel](https://www.npmjs.com/package/timer-wheel).

The `TimeoutProvider` type requires that implementations handle timer ID objects that can be converted to `number` via [Symbol.toPrimitive][toPrimitive] because runtimes like NodeJS return [objects][nodejs-timeout] from their global `setTimeout` and `setInterval` functions. TimeoutProvider implementations are free to coerce timer IDs to number internally, or to return their own custom object type that implements `{ [Symbol.toPrimitive]: () => number }`.

[nodejs-timeout]: https://nodejs.org/api/timers.html#class-timeout
[toPrimitive]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive

```tsx
type ManagedTimerId = number | { [Symbol.toPrimitive]: () => number }

type TimeoutProvider<TTimerId extends ManagedTimerId = ManagedTimerId> = {
  readonly setTimeout: (callback: TimeoutCallback, delay: number) => TTimerId
  readonly clearTimeout: (timeoutId: TTimerId | undefined) => void

  readonly setInterval: (callback: TimeoutCallback, delay: number) => TTimerId
  readonly clearInterval: (intervalId: TTimerId | undefined) => void
}
```

## `timeoutManager.setTimeout`

`setTimeout(callback, delayMs)` schedules a callback to run after approximately `delay` milliseconds, like the global [setTimeout function](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout).The callback can be canceled with `timeoutManager.clearTimeout`.

It returns a timer ID, which may be a number or an object that can be coerced to a number via [Symbol.toPrimitive][toPrimitive].

```tsx
import { timeoutManager } from '@tanstack/react-query'

const timeoutId = timeoutManager.setTimeout(
  () => console.log('ran at:', new Date()),
  1000,
)

const timeoutIdNumber: number = Number(timeoutId)
```

## `timeoutManager.clearTimeout`

`clearTimeout(timerId)` cancels a timeout callback scheduled with `setTimeout`, like the global [clearTimeout function](https://developer.mozilla.org/en-US/docs/Web/API/Window/clearTimeout). It should be called with a timer ID returned by `timeoutManager.setTimeout`.

```tsx
import { timeoutManager } from '@tanstack/react-query'

const timeoutId = timeoutManager.setTimeout(
  () => console.log('ran at:', new Date()),
  1000,
)

timeoutManager.clearTimeout(timeoutId)
```

## `timeoutManager.setInterval`

`setInterval(callback, intervalMs)` schedules a callback to be called approximately every `intervalMs`, like the global [setInterval function](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval).

Like `setTimeout`, it returns a timer ID, which may be a number or an object that can be coerced to a number via [Symbol.toPrimitive](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/toPrimitive).

```tsx
import { timeoutManager } from '@tanstack/react-query'

const intervalId = timeoutManager.setInterval(
  () => console.log('ran at:', new Date()),
  1000,
)
```

## `timeoutManager.clearInterval`

`clearInterval(intervalId)` can be used to cancel an interval, like the global [clearInterval function](https://developer.mozilla.org/en-US/docs/Web/API/Window/clearInterval). It should be called with an interval ID returned by `timeoutManager.setInterval`.

```tsx
import { timeoutManager } from '@tanstack/react-query'

const intervalId = timeoutManager.setTimeout(
  () => console.log('ran at:', new Date()),
  1000,
)

timeoutManager.clearInterval(intervalId)
```
