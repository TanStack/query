---
id: Register
title: Register
---

Defined in: [packages/query-core/src/types.ts:55](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L55)

The interface to augment via declaration merging to override Query's default types repository-wide.
Each field it declares replaces the default of the matching type: `defaultError` for [DefaultError](../type-aliases/DefaultError.md),
`queryKey` for [QueryKey](../type-aliases/QueryKey.md), `mutationKey` for [MutationKey](../type-aliases/MutationKey.md), `queryMeta` for [QueryMeta](../type-aliases/QueryMeta.md) and
`mutationMeta` for [MutationMeta](../type-aliases/MutationMeta.md). Leave a field out to keep that type's default.
Augment the module you install — `@tanstack/react-query`, `@tanstack/vue-query`,
`@tanstack/solid-query`, `@tanstack/svelte-query`, `@tanstack/preact-query`,
`@tanstack/angular-query-experimental` or `@tanstack/lit-query`. Augmenting `@tanstack/query-core`
works too and covers every adapter at once.

## Example

```ts
// Use the module you installed — here, the React adapter.
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: AxiosError
  }
}
```
