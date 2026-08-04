---
"@tanstack/query-devtools": patch
---

perf(devtools): tally the status counts in a single pass

The query and mutation status badges each backed their count with an
independent cache subscription, and every one of those subscriptions walked the
entire cache and allocated a full-size array on every cache event - five passes
for queries, four for mutations. Each set of counts is now derived from one
pass, with the individual counts exposed as memos so a badge still only updates
when its own count changes.
