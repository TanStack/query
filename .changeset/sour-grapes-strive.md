---
"@tanstack/query-persist-client-core": patch
---

Remove persisted entries with a missing or null query state during restoration and garbage collection, allowing the remaining queries, including those with null data, to be processed.
