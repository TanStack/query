---
'@tanstack/query-core': patch
---

Clear `isPaused` on a mutation that can start once its `onMutate` resolves, so it is no longer dehydrated and resumed a second time while its request is in flight.
