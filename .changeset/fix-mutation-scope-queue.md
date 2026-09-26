---
'@tanstack/query-core': patch
---

Keep each mutation in its original scope when an observer's options change, so queued mutations resume when it settles. Updated scopes still apply to future mutations.
