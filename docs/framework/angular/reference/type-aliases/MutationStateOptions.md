---
id: MutationStateOptions
title: MutationStateOptions
---

```ts
type MutationStateOptions<TResult, TMutation> = object;
```

Defined in: [packages/angular-query/src/inject-mutation-state.ts:23](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-mutation-state.ts#L23)

## Type Parameters

### TResult

`TResult` = `MutationState`

### TMutation

`TMutation` *extends* `Mutation`\<`any`, `any`, `any`, `any`\> = `MutationTypeFromResult`\<`TResult`\>

## Properties

### filters?

```ts
optional filters: MutationFilters;
```

Defined in: [packages/angular-query/src/inject-mutation-state.ts:28](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-mutation-state.ts#L28)

***

### select()?

```ts
optional select: (mutation) => TResult;
```

Defined in: [packages/angular-query/src/inject-mutation-state.ts:29](https://github.com/TanStack/query/blob/main/packages/angular-query/src/inject-mutation-state.ts#L29)

#### Parameters

##### mutation

`TMutation`

#### Returns

`TResult`
