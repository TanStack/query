---
'@tanstack/eslint-plugin-query': patch
---

Stop `no-unstable-deps` from resolving identifiers such as `toString` or `constructor` through `Object.prototype`, which reported unrelated code
