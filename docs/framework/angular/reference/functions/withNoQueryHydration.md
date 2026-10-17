---
id: withNoQueryHydration
title: withNoQueryHydration
---

```ts
function withNoQueryHydration(): QueryFeature;
```

Defined in: [packages/angular-query/src/providers.ts:188](https://github.com/TanStack/query/blob/main/packages/angular-query/src/providers.ts#L188)

Disables `TransferState` hydration and dehydration for the current environment injector.

## Returns

[`QueryFeature`](../interfaces/QueryFeature.md)

A feature that prevents automatic cache transfer for this injector.
