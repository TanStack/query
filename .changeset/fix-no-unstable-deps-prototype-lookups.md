---
'@tanstack/eslint-plugin-query': patch
---

Fix false-positive warnings in `no-unstable-deps` rule caused by `Object.prototype` property lookups (`toString`, `valueOf`, etc.).
