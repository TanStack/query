---
id: InjectMutationOptions
title: InjectMutationOptions
---

Defined in: [packages/angular-query-experimental/src/inject-mutation.ts:31](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-mutation.ts#L31)

Options for `injectMutation`, passed after the function that returns the mutation options.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-injector"></a> `injector?` | `Injector` | The `Injector` in which to create the mutation. If this is not provided, the current injection context will be used instead (via `inject`). |
