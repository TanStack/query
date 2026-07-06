---
id: QueriesControllerOptions
title: QueriesControllerOptions
---

# Type Alias: QueriesControllerOptions\<TQueryOptions, TCombinedResult\>

```ts
type QueriesControllerOptions<TQueryOptions, TCombinedResult> = Accessor<CreateQueriesControllerOptions<TQueryOptions, TCombinedResult>>;
```

Defined in: [packages/lit-query/src/types.ts:74](https://github.com/TanStack/query/blob/main/packages/lit-query/src/types.ts#L74)

Accessor-wrapped options accepted by `createQueriesController`.

## Type Parameters

### TQueryOptions

`TQueryOptions` *extends* `any`[] = `any`[]

### TCombinedResult

`TCombinedResult` = `CreateQueriesResults`\<`TQueryOptions`\>
