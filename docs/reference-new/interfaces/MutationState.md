---
id: MutationState
title: MutationState
---

# Interface: MutationState\<TData, TError, TVariables, TOnMutateResult\>

Defined in: [packages/query-core/src/mutation.ts:26](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L26)

## Extended by

- [`MutationObserverBaseResult`](MutationObserverBaseResult.md)

## Type Parameters

### TData

`TData` = `unknown`

### TError

`TError` = [`DefaultError`](../type-aliases/DefaultError.md)

### TVariables

`TVariables` = `unknown`

### TOnMutateResult

`TOnMutateResult` = `unknown`

## Properties

### context

```ts
context: TOnMutateResult | undefined;
```

Defined in: [packages/query-core/src/mutation.ts:32](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L32)

***

### data

```ts
data: TData | undefined;
```

Defined in: [packages/query-core/src/mutation.ts:33](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L33)

***

### error

```ts
error: TError | null;
```

Defined in: [packages/query-core/src/mutation.ts:34](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L34)

***

### failureCount

```ts
failureCount: number;
```

Defined in: [packages/query-core/src/mutation.ts:35](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L35)

***

### failureReason

```ts
failureReason: TError | null;
```

Defined in: [packages/query-core/src/mutation.ts:36](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L36)

***

### isPaused

```ts
isPaused: boolean;
```

Defined in: [packages/query-core/src/mutation.ts:37](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L37)

***

### status

```ts
status: MutationStatus;
```

Defined in: [packages/query-core/src/mutation.ts:38](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L38)

***

### submittedAt

```ts
submittedAt: number;
```

Defined in: [packages/query-core/src/mutation.ts:40](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L40)

***

### variables

```ts
variables: TVariables | undefined;
```

Defined in: [packages/query-core/src/mutation.ts:39](https://github.com/TanStack/query/blob/main/packages/query-core/src/mutation.ts#L39)
