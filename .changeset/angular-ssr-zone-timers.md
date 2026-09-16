---
'@tanstack/angular-query': patch
---

Prevent Zone.js server rendering from waiting for Query's background timers. Run adapter-owned Query operations outside Angular's zone while retaining PendingTasks tracking for fetches and mutations. Apply server retry and garbage-collection defaults per client without replacing global environment, notification, or timer configuration.
