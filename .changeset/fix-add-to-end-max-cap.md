---
"@tanstack/query-core": patch
---

fix(query-core): addToEnd now correctly caps result length when items already exceeds max

`addToEnd(items, item, max)` previously used `slice(1)` which only removed one element from
the front of the array. When `items.length` was already greater than `max` (e.g. when
`maxPages` is reduced at runtime), the returned array could still exceed `max`.

Replaced `slice(1)` with `slice(-max)` so the result is always capped to the last `max`
elements regardless of the input length.
