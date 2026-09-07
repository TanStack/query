---
'@tanstack/vue-query': patch
---

fix(vue-query): widen 'SkipToken' to 'symbol' so 'queryFn' type-checks as a 'computed' or inside a whole-options getter, and allow a bare reactive getter for 'queryKey' on 'useQuery'/'useQueries'
