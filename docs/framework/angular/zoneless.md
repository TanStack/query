---
id: zoneless
title: Zoneless Angular
---

Because the Angular adapter for TanStack Query is built on signals, it fully supports Zoneless!

Among Zoneless benefits are improved performance and debugging experience. For details see the [Angular documentation](https://angular.dev/guide/zoneless).

> Besides Zoneless, ZoneJS change detection is also fully supported.

> When using Zoneless, ensure you are on Angular v19 or later to take advantage of the `PendingTasks` integration that keeps `ApplicationRef.whenStable()` in sync with ongoing queries and mutations.
