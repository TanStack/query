---
'@tanstack/query-core': patch
---

fix(query-core): ignore `undefined` properties in partial-match filter keys so that `partialMatchKey` is consistent with the default `hashKey`, which drops them. Keys like `['todos', { status: undefined }]` now partially match queries with a concrete value for that property, e.g. `['todos', { status: 'open' }]`
