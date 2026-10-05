---
id: InjectMutationStateOptions
title: InjectMutationStateOptions
---

Defined in: [packages/angular-query-experimental/src/inject-mutation-state.ts:51](https://github.com/TanStack/query/blob/main/packages/angular-query-experimental/src/inject-mutation-state.ts#L51)

Options for `injectMutationState`, passed after the function that returns the mutation state
options.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-injector"></a> `injector?` | `Injector` | The `Injector` in which to create the mutation state signal. If this is not provided, the current injection context will be used instead (via `inject`). |
