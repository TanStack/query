---
'@tanstack/query-core': patch
---

Use `() => void` instead of the DOM-only `VoidFunction` type in `addConsumeAwareSignal`, so the published declarations type-check without the DOM lib.
