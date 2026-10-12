---
'@tanstack/angular-query': patch
---

Keep previously obtained `injectQueries` field signals readable while their array index is absent by retaining the last observed result. This allows child cleanup to read the fields after a query is removed without changing current-index `refetch` behavior.
