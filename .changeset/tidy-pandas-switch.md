---
'@tanstack/query-devtools': patch
---

Fix devtools state leaking between multiple mounted devtools instances. The selected query/mutation, panel width, and offline-indicator signals were created once at module scope, so interacting with one panel (e.g. selecting a query) affected every other panel on the page. They are now created per devtools instance via a new `DevtoolsStateProvider` context.
