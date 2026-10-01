---
'@tanstack/query-devtools': patch
---

Fix devtools state leaking between multiple mounted devtools instances. The selected query/mutation, panel width, and offline-indicator signals were created once at module scope, so interacting with one panel (e.g. selecting a query) affected every other panel on the page. They are now created per devtools instance via a new `DevtoolsStateProvider` context. The query/mutation cache subscription registries are scoped per instance as well, so cache updates for one client's cache no longer invoke other panels' callbacks and unmounting one panel no longer clears the others' subscriptions. The online/offline subscription also moved into the provider so panel-only instances reflect their configured `onlineManager`.
