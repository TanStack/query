---
id: QueriesObserver
title: QueriesObserver
---

# Class: QueriesObserver\<TCombinedResult\>

Defined in: [packages/query-core/src/queriesObserver.ts:35](https://github.com/TanStack/query/blob/main/packages/query-core/src/queriesObserver.ts#L35)

## Extends

- `Subscribable`\<`QueriesObserverListener`\>

## Type Parameters

### TCombinedResult

`TCombinedResult` = [`QueryObserverResult`](../type-aliases/QueryObserverResult.md)[]

## Constructors

### Constructor

```ts
new QueriesObserver<TCombinedResult>(
   client, 
   queries, 
options?): QueriesObserver<TCombinedResult>;
```

Defined in: [packages/query-core/src/queriesObserver.ts:48](https://github.com/TanStack/query/blob/main/packages/query-core/src/queriesObserver.ts#L48)

#### Parameters

##### client

[`QueryClient`](QueryClient.md)

##### queries

[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`any`, `any`, `any`, `any`, `any`, `never`\>[]

##### options?

[`QueriesObserverOptions`](../interfaces/QueriesObserverOptions.md)\<`TCombinedResult`\>

#### Returns

`QueriesObserver`\<`TCombinedResult`\>

#### Overrides

```ts
Subscribable<QueriesObserverListener>.constructor
```

## Properties

### listeners

```ts
protected listeners: Set<QueriesObserverListener>;
```

Defined in: [packages/query-core/src/subscribable.ts:2](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L2)

#### Inherited from

```ts
Subscribable.listeners
```

## Methods

### destroy()

```ts
destroy(): void;
```

Defined in: [packages/query-core/src/queriesObserver.ts:80](https://github.com/TanStack/query/blob/main/packages/query-core/src/queriesObserver.ts#L80)

#### Returns

`void`

***

### getCurrentResult()

```ts
getCurrentResult(): QueryObserverResult[];
```

Defined in: [packages/query-core/src/queriesObserver.ts:159](https://github.com/TanStack/query/blob/main/packages/query-core/src/queriesObserver.ts#L159)

#### Returns

[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)[]

***

### getObservers()

```ts
getObservers(): QueryObserver<unknown, Error, unknown, unknown, readonly unknown[]>[];
```

Defined in: [packages/query-core/src/queriesObserver.ts:167](https://github.com/TanStack/query/blob/main/packages/query-core/src/queriesObserver.ts#L167)

#### Returns

[`QueryObserver`](QueryObserver.md)\<`unknown`, `Error`, `unknown`, `unknown`, readonly `unknown`[]\>[]

***

### getOptimisticResult()

```ts
getOptimisticResult(queries, combine): [QueryObserverResult[], (r?) => TCombinedResult, () => QueryObserverResult[]];
```

Defined in: [packages/query-core/src/queriesObserver.ts:171](https://github.com/TanStack/query/blob/main/packages/query-core/src/queriesObserver.ts#L171)

#### Parameters

##### queries

[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`unknown`, `Error`, `unknown`, `unknown`, readonly `unknown`[], `never`\>[]

##### combine

`CombineFn`\<`TCombinedResult`\> | `undefined`

#### Returns

\[[`QueryObserverResult`](../type-aliases/QueryObserverResult.md)[], (`r?`) => `TCombinedResult`, () => [`QueryObserverResult`](../type-aliases/QueryObserverResult.md)[]\]

***

### getQueries()

```ts
getQueries(): Query<unknown, Error, unknown, readonly unknown[]>[];
```

Defined in: [packages/query-core/src/queriesObserver.ts:163](https://github.com/TanStack/query/blob/main/packages/query-core/src/queriesObserver.ts#L163)

#### Returns

[`Query`](Query.md)\<`unknown`, `Error`, `unknown`, readonly `unknown`[]\>[]

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

### onSubscribe()

```ts
protected onSubscribe(): void;
```

Defined in: [packages/query-core/src/queriesObserver.ts:64](https://github.com/TanStack/query/blob/main/packages/query-core/src/queriesObserver.ts#L64)

#### Returns

`void`

#### Overrides

```ts
Subscribable.onSubscribe
```

***

### onUnsubscribe()

```ts
protected onUnsubscribe(): void;
```

Defined in: [packages/query-core/src/queriesObserver.ts:74](https://github.com/TanStack/query/blob/main/packages/query-core/src/queriesObserver.ts#L74)

#### Returns

`void`

#### Overrides

```ts
Subscribable.onUnsubscribe
```

***

### setQueries()

```ts
setQueries(queries, options?): void;
```

Defined in: [packages/query-core/src/queriesObserver.ts:87](https://github.com/TanStack/query/blob/main/packages/query-core/src/queriesObserver.ts#L87)

#### Parameters

##### queries

[`QueryObserverOptions`](../interfaces/QueryObserverOptions.md)\<`unknown`, `Error`, `unknown`, `unknown`, readonly `unknown`[], `never`\>[]

##### options?

[`QueriesObserverOptions`](../interfaces/QueriesObserverOptions.md)\<`TCombinedResult`\>

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

`QueriesObserverListener`

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
