---
"@tanstack/query-devtools": patch
---

Fix multiple mounted Devtools instances (e.g. two panels pointing at two different `QueryClient`s) sharing selection, panel width, offline-mocking, and cache-subscription state through module-level signals and maps. Each Devtools instance now owns its own isolated UI/subscription state, so selecting a query, resizing, or mocking offline behavior in one panel no longer affects any other mounted panel.
