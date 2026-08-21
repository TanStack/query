---
'@tanstack/preact-query': patch
---

Evaluate a function-form `throwOnError` against the actual query error before disabling `retryOnMount` (port of #9338), so errored queries whose `throwOnError` returns `false` are retried on mount again.
