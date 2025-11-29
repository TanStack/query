---
id: Mutation
title: Mutation
---

# Class: Mutation\<TData, TError, TVariables, TOnMutateResult\>

Defined in: [packages/query-core/src/mutation.ts:84](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L84)

## Extends

- `Removable`

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

### TVariables

`TVariables` = `unknown`

### TOnMutateResult

`TOnMutateResult` = `unknown`

## Constructors

### Constructor

```ts
new Mutation<TData, TError, TVariables, TOnMutateResult>(config): Mutation<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/query-core/src/mutation.ts:101](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L101)

#### Parameters

##### config

`MutationConfig`\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

#### Returns

`Mutation`\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

#### Overrides

```ts
Removable.constructor
```

## Properties

### gcTime

```ts
gcTime: number;
```

Defined in: [packages/query-core/src/removable.ts:6](https://github.com/TanStack/query/blob/main/packages/query-core/src/removable.ts#L6)

#### Inherited from

```ts
Removable.gcTime
```

***

### mutationId

```ts
readonly mutationId: number;
```

Defined in: [packages/query-core/src/mutation.ts:92](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L92)

***

### options

```ts
options: MutationOptions<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/query-core/src/mutation.ts:91](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L91)

***

### state

```ts
state: MutationState<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/query-core/src/mutation.ts:90](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L90)

## Accessors

### meta

#### Get Signature

```ts
get meta(): Record<string, unknown> | undefined;
```

Defined in: [packages/query-core/src/mutation.ts:124](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L124)

##### Returns

`Record`\<`string`, `unknown`\> \| `undefined`

## Methods

### addObserver()

```ts
addObserver(observer): void;
```

Defined in: [packages/query-core/src/mutation.ts:128](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L128)

#### Parameters

##### observer

[`MutationObserver`](MutationObserver.md)\<`any`, `any`, `any`, `any`\>

#### Returns

`void`

***

### clearGcTimeout()

```ts
protected clearGcTimeout(): void;
```

Defined in: [packages/query-core/src/removable.ts:31](https://github.com/TanStack/query/blob/main/packages/query-core/src/removable.ts#L31)

#### Returns

`void`

#### Inherited from

```ts
Removable.clearGcTimeout
```

***

### continue()

```ts
continue(): Promise<unknown>;
```

Defined in: [packages/query-core/src/mutation.ts:165](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L165)

#### Returns

`Promise`\<`unknown`\>

***

### destroy()

```ts
destroy(): void;
```

Defined in: [packages/query-core/src/removable.ts:9](https://github.com/TanStack/query/blob/main/packages/query-core/src/removable.ts#L9)

#### Returns

`void`

#### Inherited from

```ts
Removable.destroy
```

***

### execute()

```ts
execute(variables): Promise<TData>;
```

Defined in: [packages/query-core/src/mutation.ts:173](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L173)

#### Parameters

##### variables

`TVariables`

#### Returns

`Promise`\<`TData`\>

***

### optionalRemove()

```ts
protected optionalRemove(): void;
```

Defined in: [packages/query-core/src/mutation.ts:155](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L155)

#### Returns

`void`

#### Overrides

```ts
Removable.optionalRemove
```

***

### removeObserver()

```ts
removeObserver(observer): void;
```

Defined in: [packages/query-core/src/mutation.ts:143](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L143)

#### Parameters

##### observer

[`MutationObserver`](MutationObserver.md)\<`any`, `any`, `any`, `any`\>

#### Returns

`void`

***

### scheduleGc()

```ts
protected scheduleGc(): void;
```

Defined in: [packages/query-core/src/removable.ts:13](https://github.com/TanStack/query/blob/main/packages/query-core/src/removable.ts#L13)

#### Returns

`void`

#### Inherited from

```ts
Removable.scheduleGc
```

***

### setOptions()

```ts
setOptions(options): void;
```

Defined in: [packages/query-core/src/mutation.ts:116](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L116)

#### Parameters

##### options

[`MutationOptions`](../interfaces/MutationOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

#### Returns

`void`

***

### updateGcTime()

```ts
protected updateGcTime(newGcTime): void;
```

Defined in: [packages/query-core/src/removable.ts:23](https://github.com/TanStack/query/blob/main/packages/query-core/src/removable.ts#L23)

#### Parameters

##### newGcTime

`number` | `undefined`

#### Returns

`void`

#### Inherited from

```ts
Removable.updateGcTime
```
