---
id: parallel-queries
title: Parallel Queries
ref: docs/framework/react/guides/parallel-queries
replace: { 'React': 'Preact', 'react-query': 'preact-query' }
---

[//]: # 'Info'

> When using Preact Query with compat's Suspense, this pattern of parallelism does not work, since the first query would throw a promise internally and would suspend the component before the other queries run. To get around this, you'll either need to use the `useSuspenseQueries` hook (which is suggested) or orchestrate your own parallelism with separate components for each `useSuspenseQuery` instance.

[//]: # 'Info'
