---
'@tanstack/eslint-plugin-query': patch
---

Fix `exhaustive-deps` to detect dependencies used inside nested `queryFn` callbacks/control flow, and avoid false positives when those dependencies are already present in complex `queryKey` expressions.
