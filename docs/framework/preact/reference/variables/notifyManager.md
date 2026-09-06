---
id: notifyManager
title: notifyManager
---

```ts
const notifyManager: object;
```

Defined in: [packages/query-core/src/notifyManager.ts:144](https://github.com/TanStack/query/blob/main/packages/query-core/src/notifyManager.ts#L144)

Handles scheduling and batching callbacks in TanStack Query.

## Type Declaration

### batch()

```ts
readonly batch: <T>(callback) => T;
```

Batches all updates scheduled inside the passed callback.
This is mainly used internally to optimize query client updating.
Batches can be nested; the queue is only flushed once the outermost `batch` call finishes.
The return value of `callback` is passed through.

#### Type Parameters

##### T

`T`

#### Parameters

##### callback

() => `T`

#### Returns

`T`

### batchCalls()

```ts
readonly batchCalls: <T>(callback) => BatchCallsCallback<T>;
```

All calls to the wrapped function will be batched.

#### Type Parameters

##### T

`T` *extends* `unknown`[]

#### Parameters

##### callback

`BatchCallsCallback`\<`T`\>

#### Returns

`BatchCallsCallback`\<`T`\>

### schedule()

```ts
schedule: (callback) => void;
```

Schedules a function to be run on the next batch.
By default, the batch is run with a `setTimeout`, but this can be configured via `setScheduler`.

#### Parameters

##### callback

`NotifyCallback`

#### Returns

`void`

### setBatchNotifyFunction()

```ts
readonly setBatchNotifyFunction: (fn) => void;
```

Use this method to set a custom function to batch notifications together into a single tick.
Framework adapters use this to plug in their own batching primitive, so that a single query
update only triggers one re-render instead of one per subscriber.

#### Parameters

##### fn

`BatchNotifyFunction`

#### Returns

`void`

#### Example

```ts
import { notifyManager } from '@tanstack/query-core'
import { batch } from 'solid-js'

notifyManager.setBatchNotifyFunction(batch)
```

### setNotifyFunction()

```ts
readonly setNotifyFunction: (fn) => void;
```

Use this method to set a custom notify function.
This can be used to for example wrap notifications with `React.act` while running tests.

#### Parameters

##### fn

`NotifyFunction`

#### Returns

`void`

### setScheduler()

```ts
readonly setScheduler: (fn) => void;
```

Configures a custom callback that schedules when the next batch runs.
The default behavior is `setTimeout(callback, 0)`.

#### Parameters

##### fn

`ScheduleFunction`

#### Returns

`void`

#### Example

```ts
import { notifyManager } from '@tanstack/query-core'

// Schedule batches in the next microtask
notifyManager.setScheduler(queueMicrotask)

// Schedule batches before the next frame is rendered
notifyManager.setScheduler(requestAnimationFrame)

// Schedule batches some time in the future
notifyManager.setScheduler((cb) => setTimeout(cb, 10))
```
