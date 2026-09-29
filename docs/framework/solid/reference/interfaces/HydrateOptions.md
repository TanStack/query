---
id: HydrateOptions
title: HydrateOptions
---

Defined in: [packages/query-core/src/hydration.ts:61](https://github.com/TanStack/query/blob/main/packages/query-core/src/hydration.ts#L61)

Options for `hydrate`, controlling the default options applied to queries/mutations restored from a
`DehydratedState`, and how to reverse any transformation applied by `DehydrateOptions.serializeData`.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="defaultoptions"></a> `defaultOptions?` | `object` | Options applied to the queries and mutations restored from the dehydrated state. |
| `defaultOptions.deserializeData?` | `TransformerFn` | Transforms a query's `data` after it is read from the dehydrated state, reversing `serializeData`. |
| `defaultOptions.mutations?` | `MutationOptions`\<`unknown`, `Error`, `unknown`, `unknown`\> | Default options merged into every mutation restored from the dehydrated state. |
| `defaultOptions.queries?` | `QueryOptions`\<`unknown`, `Error`, `unknown`, readonly `unknown`[], `never`\> | Default options merged into every query restored from the dehydrated state. |
