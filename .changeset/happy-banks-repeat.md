---
'@tanstack/query-core': patch
---

fix: use Object.is instead of === in replaceEqualDeep to correctly handle NaN equality
