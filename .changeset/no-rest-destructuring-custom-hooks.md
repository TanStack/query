---
"@tanstack/eslint-plugin-query": minor
---

`no-rest-destructuring` now also flags rest destructuring on custom hooks that return a TanStack Query result. Detection uses the TypeScript type checker and runs only when typed linting is enabled, so untyped projects are unaffected. Closes #8951.
