---
'@tanstack/query-core': patch
---

fix(query-core): guard against malformed `InfiniteData` whose `pages` is `undefined`

`hasNextPage`/`hasPreviousPage` only checked for a missing `data`, so a malformed
`InfiniteData` (where `data.pages` is `undefined`) reaching `getNextPageParam`
threw `TypeError: Cannot read properties of undefined (reading 'length')`. This
can happen at runtime via SSR hydration or an external `setQueryData`. Guard
`pages` before reading `.length` so these helpers return `false`/`undefined`
instead of crashing.
