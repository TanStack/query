---
'@tanstack/solid-query': patch
'@tanstack/solid-query-devtools': patch
'@tanstack/solid-query-persist-client': patch
---

Require solid-js and @solidjs/web 2.0.0-rc.6+. rc.6 ships the named flight-data source API the single-flight consumer uses, plus the async settle fix the adapter depends on (rc.5's settle-walk regression breaks query hydration).
