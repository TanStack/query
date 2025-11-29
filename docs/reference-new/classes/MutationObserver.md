---
id: MutationObserver
title: MutationObserver
---

# Class: MutationObserver\<TData, TError, TVariables, TOnMutateResult\>

Defined in: [packages/query-core/src/mutationObserver.ts:23](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L23)

## Extends

- `Subscribable`\<`MutationObserverListener`\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>\>

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

### TVariables

`TVariables` = `void`

### TOnMutateResult

`TOnMutateResult` = `unknown`

## Constructors

### Constructor

```ts
new MutationObserver<TData, TError, TVariables, TOnMutateResult>(client, options): MutationObserver<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/query-core/src/mutationObserver.ts:43](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L43)

#### Parameters

##### client

[`QueryClient`](QueryClient.md)

##### options

[`MutationObserverOptions`](../interfaces/MutationObserverOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

#### Returns

`MutationObserver`\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

#### Overrides

```ts
Subscribable<
  MutationObserverListener<TData, TError, TVariables, TOnMutateResult>
>.constructor
```

## Properties

### listeners

```ts
protected listeners: Set<MutationObserverListener<TData, TError, TVariables, TOnMutateResult>>;
```

Defined in: [packages/query-core/src/subscribable.ts:2](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L2)

#### Inherited from

```ts
Subscribable.listeners
```

***

### options

```ts
options: MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/query-core/src/mutationObserver.ts:31](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L31)

## Methods

### bindMethods()

```ts
protected bindMethods(): void;
```

Defined in: [packages/query-core/src/mutationObserver.ts:60](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L60)

#### Returns

`void`

***

### getCurrentResult()

```ts
getCurrentResult(): MutationObserverResult<TData, TError, TVariables, TOnMutateResult>;
```

Defined in: [packages/query-core/src/mutationObserver.ts:110](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L110)

#### Returns

[`MutationObserverResult`](../type-aliases/MutationObserverResult.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

***

### hasListeners()

```ts
hasListeners(): boolean;
```

Defined in: [packages/query-core/src/subscribable.ts:19](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L19)

#### Returns

`boolean`

#### Inherited from

```ts
Subscribable.hasListeners
```

***

### mutate()

```ts
mutate(variables, options?): Promise<TData>;
```

Defined in: [packages/query-core/src/mutationObserver.ts:128](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L128)

#### Parameters

##### variables

`TVariables`

##### options?

[`MutateOptions`](../interfaces/MutateOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

#### Returns

`Promise`\<`TData`\>

***

### onMutationUpdate()

```ts
onMutationUpdate(action): void;
```

Defined in: [packages/query-core/src/mutationObserver.ts:102](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L102)

#### Parameters

##### action

`Action`\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

#### Returns

`void`

***

### onSubscribe()

```ts
protected onSubscribe(): void;
```

Defined in: [packages/query-core/src/subscribable.ts:23](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L23)

#### Returns

`void`

#### Inherited from

```ts
Subscribable.onSubscribe
```

***

### onUnsubscribe()

```ts
protected onUnsubscribe(): void;
```

Defined in: [packages/query-core/src/mutationObserver.ts:96](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L96)

#### Returns

`void`

#### Overrides

```ts
Subscribable.onUnsubscribe
```

***

### reset()

```ts
reset(): void;
```

Defined in: [packages/query-core/src/mutationObserver.ts:119](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L119)

#### Returns

`void`

***

### setOptions()

```ts
setOptions(options): void;
```

Defined in: [packages/query-core/src/mutationObserver.ts:65](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutationObserver.ts#L65)

#### Parameters

##### options

[`MutationObserverOptions`](../interfaces/MutationObserverOptions.md)\<`TData`, `TError`, `TVariables`, `TOnMutateResult`\>

#### Returns

`void`

***

### subscribe()

```ts
subscribe(listener): () => void;
```

Defined in: [packages/query-core/src/subscribable.ts:8](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L8)

#### Parameters

##### listener

`MutationObserverListener`

#### Returns

```ts
(): void;
```

##### Returns

`void`

#### Inherited from

```ts
Subscribable.subscribe
```
