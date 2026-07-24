---
"@tanstack/query-devtools": patch
---

Fix devtools UI state (selected query/mutation, panel width, offline mock toggle, and query/mutation cache subscriptions) leaking between independently mounted devtools instances. Selecting a query, resizing a panel, or mocking offline behavior in one devtools instance no longer affects another instance mounted on a different `QueryClient`.
