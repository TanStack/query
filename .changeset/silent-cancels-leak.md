---
'@tanstack/query-core': patch
---

Fix `Query.fetch()` rejecting with an internal, silent `CancelledError` when `removeQueries`/`resetQueries`/`clear()` cancels an in-flight fetch without starting a replacement one. It now resolves with the last known data instead, matching the behavior already used for `cancelRefetch`.
