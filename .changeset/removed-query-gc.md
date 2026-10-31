---
"@tanstack/query-core": patch
---

Avoid restarting garbage-collection timers for removed queries when their last observer unsubscribes or a cancelled fetch settles.
