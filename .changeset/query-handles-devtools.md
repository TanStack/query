---
'@tanstack/query-core': minor
'@tanstack/query-devtools': minor
---

feat: show how experimental query handles started their queries in the devtools. `experimental_getQueryStartInfo` returns which handle function started a query, where and when, and whether it has been read. The devtools show it, mark queries first fetched by a reader of an `experimental_waterfallHandle` handle and flag prefetched queries that were never read. In development, `dehydrate` warns when it leaves out a pending query that a handle function started on the server.
