---
'@tanstack/solid-query': patch
---

fix: prevent cache notifications during a Solid transition landing from reading a query options memo that has no committed value.
