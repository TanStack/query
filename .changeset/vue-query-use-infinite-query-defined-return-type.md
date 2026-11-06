---
'@tanstack/vue-query': patch
---

fix(vue-query/useInfiniteQuery): return 'UseInfiniteQueryDefinedReturnType' from the 'Defined' overload so 'data' is no longer typed as possibly 'undefined' when 'initialData' is defined
