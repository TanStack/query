---
'@tanstack/react-query': patch
'@tanstack/peact-query': patch
'@tanstack/query-core': patch
---

fix(react): make sure suspense queries can resolve if data gets into the cache in other ways by tracking a promise from the query directly instead of tying it to the fetch that triggered it.
