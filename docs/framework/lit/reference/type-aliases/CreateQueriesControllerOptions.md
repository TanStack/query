---
id: CreateQueriesControllerOptions
title: CreateQueriesControllerOptions
---

```ts
type CreateQueriesControllerOptions<TQueryOptions, TCombinedResult> = object;
```

Defined in: [packages/lit-query/src/createQueriesController.ts:195](https://github.com/TanStack/query/blob/main/packages/lit-query/src/createQueriesController.ts#L195)

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

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="combine"></a> `combine?` | (`result`: `CreateQueriesResults`\<`TQueryOptions`\>) => `TCombinedResult` | Optional function that combines the query result array into one value. |
| <a id="queries"></a> `queries` | [`Accessor`](Accessor.md)\< \| readonly \[`...CreateQueriesOptions<TQueryOptions>`\] \| readonly \[`...{ [K in keyof TQueryOptions]: GetCreateQueriesInput<TQueryOptions[K]> }`\]\> | Query options to observe, or a getter that returns the current options. |
