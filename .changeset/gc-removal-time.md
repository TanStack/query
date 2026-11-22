---
"@tanstack/query-core": major
---

Garbage collect a query or mutation at the latest removal time any of its users has scheduled, instead of after the largest `gcTime` it has seen. Remove the `gcTime` property from `Query` and `Mutation`; read `options.gcTime` instead.
