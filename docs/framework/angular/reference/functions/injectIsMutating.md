---
id: injectIsMutating
title: injectIsMutating
---

# Function: injectIsMutating()

```ts
function injectIsMutating(filters?, options?): Signal<number>;
```

Defined in: [inject-is-mutating.ts:30](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-is-mutating.ts#L30)

Injects a signal that tracks the number of mutations that your application is fetching.

Can be used for app-wide loading indicators

## Parameters

### filters?

`MutationFilters`\<`unknown`, `Error`, `unknown`, `unknown`\>

The filters to apply to the query.

### options?

[`InjectIsMutatingOptions`](../../interfaces/InjectIsMutatingOptions.md)

Additional configuration

## Returns

`Signal`\<`number`\>

A read-only signal with the number of fetching mutations.
