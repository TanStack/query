---
id: injectIsMutating
title: injectIsMutating
---

```ts
function injectIsMutating(filters: () => MutationFilters): Signal<number>;
```

Defined in: [packages/angular-query/src/inject-is-mutating.ts:15](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-is-mutating.ts#L15)

Injects a signal that tracks the number of mutations that your application currently has `pending`
(useful for app-wide loading indicators).

Can be used for app-wide loading indicators

## Parameters

### filters

() => [`MutationFilters`](../interfaces/MutationFilters.md)

A reactive factory for the filters.

## Returns

`Signal`\<`number`\>

A read-only signal with the number of fetching mutations.
