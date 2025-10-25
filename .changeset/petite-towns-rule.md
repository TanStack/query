---
'@tanstack/query-core': patch
---

When running queryClient.fetchQuery, the query will no longer be cancelled if other observers are unsubscribed
