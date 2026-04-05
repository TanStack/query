---
'@tanstack/query-devtools': patch
---

Guard devtools mutation timestamp formatting against invalid browser locale
values by canonicalizing navigator locales before calling
`Date.prototype.toLocaleString()`.
