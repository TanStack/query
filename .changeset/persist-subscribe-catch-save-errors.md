---
'@tanstack/query-persist-client-core': patch
---

fix(query-persist-client-core): catch errors when persisting in 'persistQueryClientSubscribe' to prevent unhandled promise rejections, and log them in development
