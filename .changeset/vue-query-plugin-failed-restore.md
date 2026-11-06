---
'@tanstack/vue-query': patch
---

Reset `isRestoring` in `VueQueryPlugin` when the `clientPersister` promise rejects, so queries no longer wait forever for a failed restore, and handle the rejection instead of leaving it unhandled.
