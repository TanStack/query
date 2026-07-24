---
'@tanstack/eslint-plugin-query': patch
---

Fix false positive in `no-unstable-deps` when a variable is assigned from a call whose name matches an `Object.prototype` method (e.g. `toString`, `valueOf`, `constructor`).
