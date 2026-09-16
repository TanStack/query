---
'@tanstack/angular-query': patch
---

Centralize external-store reads, subscriptions, and cleanup outside Angular's zone. Preserve separate boundaries for reactive option updates and imperative operations so Query background timers do not delay server rendering.
