---
'@tanstack/query-core': patch
---

fix(`partialMatchKey`): distinguish query keys that differ only by a `Date`

Non-exact key matching (used by `invalidateQueries`, `refetchQueries`, `removeQueries`, `cancelQueries`, etc.) traversed objects structurally, so two keys differing only by a `Date` value (e.g. `['report', { from: dateA }]` vs `['report', { from: dateB }]`) were treated as equal even though `hashKey` stores them as separate queries. `partialMatchKey` now compares non-plain objects the same way `hashKey` serializes them, keeping non-exact matching consistent with cache identity.
