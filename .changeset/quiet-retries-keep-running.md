---
'@tanstack/query-core': patch
---

Keep retrying failed queries while the tab is in the background when `refetchIntervalInBackground` is `true`. Previously the retryer paused until the page regained focus, which defeated the purpose of `refetchIntervalInBackground`.
