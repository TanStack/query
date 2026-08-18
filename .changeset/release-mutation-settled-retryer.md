---
'@tanstack/query-core': patch
---

Release a mutation's retryer once execute settles, so the settled promise no longer keeps that mutation's variables and result reachable for the MutationCache lifetime.
