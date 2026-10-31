---
'@tanstack/query-core': patch
---

Avoid repeatedly setting up custom focus and online event listeners that do not return a cleanup function when subscribers are added.
