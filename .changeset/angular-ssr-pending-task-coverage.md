---
'@tanstack/angular-query-experimental': patch
---

Keep the SSR pending task registered from fetch start until the query result is applied to the result signal. Previously the task was registered and released inside the subscriber callback: registration waited for the first notifyManager delivery turn (`setTimeout(0)`), and release ran one statement before the result signal write. With zoneless change detection, `ApplicationRef.whenStable()` could resolve in either gap, so Angular SSR serialized HTML rendered from stale optimistic state even though the fetch had completed.
