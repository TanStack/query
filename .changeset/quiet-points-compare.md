---
'@tanstack/query-core': patch
---

Fix `shallowEqualObjects` to compare own property keys and values and ignore inherited properties. Objects with different own keys now compare as unequal, including when the differing values are `undefined`.
