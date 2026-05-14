---
id: CreateQueriesControllerOptions
title: CreateQueriesControllerOptions
---

# Type Alias: CreateQueriesControllerOptions\<TQueryOptions, TCombinedResult\>

```ts
type CreateQueriesControllerOptions<TQueryOptions, TCombinedResult> = object;
```

Defined in: [packages/lit-query/src/createQueriesController.ts:194](https://github.com/TanStack/query/blob/main/packages/lit-query/src/createQueriesController.ts#L194)

Options accepted by `createQueriesController`.

`queries` can be a static list or a getter that returns the current list.
`combine` can reshape the array of query results into a single value for the
returned accessor.

## Type Parameters

### TQueryOptions

`TQueryOptions` *extends* `any`[] = `any`[]

### TCombinedResult

`TCombinedResult` = `CreateQueriesResults`\<`TQueryOptions`\>

## Properties

### combine()?

```ts
optional combine: (result) => TCombinedResult;
```

Defined in: [packages/lit-query/src/createQueriesController.ts:208](https://github.com/TanStack/query/blob/main/packages/lit-query/src/createQueriesController.ts#L208)

Optional function that combines the query result array into one value.

#### Parameters

##### result

`CreateQueriesResults`\<`TQueryOptions`\>

#### Returns

`TCombinedResult`

***

### queries

```ts
queries: Accessor<
  | readonly [...CreateQueriesOptions<TQueryOptions>]
| readonly [...{ [K in keyof TQueryOptions]: GetCreateQueriesInput<TQueryOptions[K]> }]>;
```

Defined in: [packages/lit-query/src/createQueriesController.ts:199](https://github.com/TanStack/query/blob/main/packages/lit-query/src/createQueriesController.ts#L199)

Query options to observe, or a getter that returns the current options.
