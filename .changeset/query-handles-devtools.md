---
'@tanstack/query-core': minor
'@tanstack/query-devtools': minor
---

Show in the devtools how experimental query handles started their queries. `experimental_getQueryStartInfo` returns which handle function started a query, where and when, and whether anything has read it since. The devtools show this, mark queries that a reader of an `experimental_waterfallHandle` handle first fetched, and flag prefetched queries that nothing read. In development, `dehydrate` warns when it leaves out a pending query that a handle function started on the server.
