---
'@tanstack/query-core': major
---

Move mutation construction to `Mutation.build(client, options, state?)`. Replace calls to the internal `MutationCache.build` method with this static method. Query-only bundles can now omit mutation execution code.
