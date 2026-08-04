---
'@tanstack/query-devtools': patch
---

Keep the devtools query list array stable when its contents have not changed

The list of queries to render was rebuilt into a fresh array on every cache
event. Most events - a query's data changing, a fetch settling - leave both the
membership and the order of that list untouched, but the new array was still a
new value, so every downstream consumer recomputed and the virtualizer
rediffed.

The memo now returns the previous array when the recomputed one holds the same
queries in the same order, so consumers only rerun when the list has genuinely
changed.
