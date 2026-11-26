---
'@tanstack/query-core': patch
---

Remove the internal `behavior` query option. Infinite queries install their own fetch behavior, so nothing set it anymore.
