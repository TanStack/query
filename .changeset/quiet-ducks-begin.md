---
"@tanstack/query-core": patch

fix(query-core): `resetQueries` now correctly refetches queries even when the filter predicate depends on mutable state (`status`, `data`, etc.). Previously, `query.reset()` mutated the query state before `refetchQueries` could match the same queries, causing them to be skipped.
