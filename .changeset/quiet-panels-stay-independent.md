---
'@tanstack/query-devtools': patch
---

Isolate selection, responsive panel state, and cache subscriptions between mounted DevTools instances. Keep subscriptions attached to the current client and prevent one instance's cleanup from affecting another.
