---
id: injectIsMutating
title: injectIsMutating
---

# Function: injectIsMutating()

```ts
function injectIsMutating(filters?, injector?): Signal<number>
```

Injects a signal that tracks the number of mutations that your application is fetching.

Can be used for app-wide loading indicators

## Parameters

• **filters?**: `MutationFilters`

The filters to apply to the query.

• **injector?**: `Injector`

The Angular injector to use.

## Returns

`Signal`\<`number`\>

signal with number of fetching mutations.

## Defined in

[inject-is-mutating.ts:16](https://github.com/TanStack/query/blob/27861961bbb36e9bc25fcd45cff21b5645f02f9b/packages/angular-query-experimental/src/inject-is-mutating.ts#L16)
