---
'@tanstack/query-core': patch
---

Report placeholder factory failures on the observer without interrupting other observers of the query. Treat falsy values thrown by a selector as errors, and clear the selector error when the selector is removed.
