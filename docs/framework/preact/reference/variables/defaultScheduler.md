---
id: defaultScheduler
title: defaultScheduler
---

```ts
const defaultScheduler: ScheduleFunction = systemSetTimeoutZero;
```

Defined in: [packages/query-core/src/notifyManager.ts:19](https://github.com/TanStack/query/blob/main/packages/query-core/src/notifyManager.ts#L19)

Default scheduling function used by the notify manager.
Schedules the callback with the system's `setTimeout(callback, 0)`.
