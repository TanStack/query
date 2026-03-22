---
'@tanstack/eslint-plugin-query': minor
---

BREAKING (eslint-plugin): The `exhaustive-deps` rule now reports member expression dependencies more granularly for call expressions (e.g. `a.b.foo()` suggests `a.b`), which may cause existing code that previously passed the rule to now report missing dependencies. To accommodate stable variables and types, the rule now accepts an `allowlist` option with `variables` and `types` arrays to exclude specific dependencies from enforcement.
