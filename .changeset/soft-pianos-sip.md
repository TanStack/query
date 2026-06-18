---
'@tanstack/eslint-plugin-query': patch
---

Relax `exhaustive-deps` so function call targets are not required in query keys while values referenced in nested callbacks are still checked.
