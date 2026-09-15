---
'@tanstack/query-persist-client-core': patch
---

fix(query-persist-client-core/createPersister): await the storage write in `persistQuery`, so `persistQueryByKey` resolves only once the entry has actually been written and rejects when the write fails instead of leaving an unhandled rejection
