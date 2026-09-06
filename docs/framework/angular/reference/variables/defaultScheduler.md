---
id: defaultScheduler
title: defaultScheduler
---

```ts
const defaultScheduler: ScheduleFunction;
```

Defined in: packages/query-core/dist-ts/src/notifyManager.d.ts:10

Default scheduling function used by the notify manager.
Schedules the callback with the system's `setTimeout(callback, 0)`.
