---
'@tanstack/query-core': patch
---

Release a mutation's retryer once its execution settles, so the settled promise no longer keeps that mutation's result, variables and context in memory for as long as the mutation cache retains it.
