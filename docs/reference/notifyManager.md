---
id: NotifyManager
title: NotifyManager
---

The `notifyManager` handles scheduling and batching callbacks in TanStack Query.

It exposes the following methods:

- [batch](#notifymanagerbatch)
- [batchCalls](#notifymanagerbatchcalls)
- [schedule](#notifymanagerschedule)
- [setNotifyFunction](#notifymanagersetnotifyfunction)
- [setBatchNotifyFunction](#notifymanagersetbatchnotifyfunction)
- [setScheduler](#notifymanagersetscheduler)

## `notifyManager.batch`

`batch` can be used to batch all updates scheduled inside the passed callback.
This is mainly used internally to optimize queryClient updating.

```ts
function batch<T>(callback: () => T): T
```

## `notifyManager.batchCalls`

`batchCalls` is a higher-order function that takes a callback and wraps it.
All calls to the wrapped function schedule the callback to be run on the next batch.

```ts
type BatchCallsCallback<T extends Array<unknown>> = (...args: T) => void

function batchCalls<T extends Array<unknown>>(
  callback: BatchCallsCallback<T>,
): BatchCallsCallback<T>
```

## `notifyManager.schedule`

`schedule` schedules a function to be run on the next batch. By default, the batch is run
with a setTimeout, but this can be configured.

```ts
function schedule(callback: () => void): void
```

## `notifyManager.setNotifyFunction`

`setNotifyFunction` overrides the notify function. This function is passed the
callback when it should be executed. The default notifyFunction just calls it.

This can be used to for example wrap notifications with `React.act` while running tests:

```ts
import { notifyManager } from '@tanstack/react-query'
import { act } from 'react-dom/test-utils'

notifyManager.setNotifyFunction(act)
```

## `notifyManager.setBatchNotifyFunction`

`setBatchNotifyFunction` sets the function to use for batched updates

If your framework supports a custom batching function, you can let TanStack Query know about it by calling notifyManager.setBatchNotifyFunction.

For example, this is how the batch function is set in solid-query:

```ts
import { notifyManager } from '@tanstack/query-core'
import { batch } from 'solid-js'

notifyManager.setBatchNotifyFunction(batch)
```

## `notifyManager.setScheduler`

`setScheduler` configures a custom callback that should schedules when the next
batch runs. The default behaviour is `setTimeout(callback, 0)`.

```ts
import { notifyManager } from '@tanstack/react-query'

// Schedule batches in the next microtask
notifyManager.setScheduler(queueMicrotask)

// Schedule batches before the next frame is rendered
notifyManager.setScheduler(requestAnimationFrame)

// Schedule batches some time in the future
notifyManager.setScheduler((cb) => setTimeout(cb, 10))
```
