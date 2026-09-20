---
'@tanstack/svelte-query': patch
---

Prevent reactive option updates from cancelling an in-flight refetch when the query identity and enabled state are unchanged.