---
id: defaultScheduler
title: defaultScheduler
---

```ts
const defaultScheduler: ScheduleFunction = systemSetTimeoutZero;
```

Defined in: packages/query-core/src/notifyManager.ts:19

Default scheduling function used by the notify manager.
Schedules the callback with the system's `setTimeout(callback, 0)`.
