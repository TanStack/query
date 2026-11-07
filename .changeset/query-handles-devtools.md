---
'@tanstack/query-core': minor
'@tanstack/query-devtools': minor
---

Show in the devtools how experimental query handles started their queries. In development, `experimental_getQueryStartInfo` returns which handle function started a query, where and when, and whether anything has read it since. Production builds record nothing. The devtools show this, mark with a `waterfall` badge queries whose first fetch a component's query hook started on a client that uses handles, and flag prefetched queries that nothing read. In development, `dehydrate` warns when it leaves out a pending query that a handle function started on the server.
