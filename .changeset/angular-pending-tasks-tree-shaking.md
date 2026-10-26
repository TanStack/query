---
'@tanstack/angular-query-experimental': patch
---

fix(angular-query-experimental): read the `PendingTasks` token with a static member access so `@angular/core` stays tree-shakeable

`pending-tasks-compat` read the token with `Reflect.get(ng, 'PendingTasks')`. A dynamic lookup on a namespace import cannot be tree-shaken, so bundlers kept every export of `@angular/core` in the initial bundle of any app that calls `injectQuery` or `injectMutation`, even when those are only used in a lazy chunk. The token is now read as `ng.PendingTasks`, which tree-shakes like a named import. On Angular < 19 the export is still missing, so the shim keeps falling back to its no-op implementation.
