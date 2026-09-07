---
id: CancelledError
title: CancelledError
---

Defined in: [packages/query-core/src/retryer.ts:77](https://github.com/TanStack/query/blob/main/packages/query-core/src/retryer.ts#L77)

The error thrown by a `Retryer` (and surfaced to `query.promise`/`mutation`) when a fetch is cancelled, e.g. via
`query.cancel()`. `revert`, if `true`, tells the caller to restore the state the query was in before the fetch
started instead of surfacing the error. `silent`, if `true`, tells the caller to suppress this error and instead
resolve with the promise of the fetch that triggered the cancellation.

## Example

```ts
query.cancel()

try {
  await query.promise
} catch (error) {
  if (error instanceof CancelledError) {
    // the fetch was cancelled, e.g. via `query.cancel()`
  }
}
```

## Extends

- `Error`

## Constructors

### Constructor

```ts
new CancelledError(options?): CancelledError;
```

Defined in: [packages/query-core/src/retryer.ts:80](https://github.com/TanStack/query/blob/main/packages/query-core/src/retryer.ts#L80)

#### Parameters

##### options?

[`CancelOptions`](../interfaces/CancelOptions.md)

#### Returns

`CancelledError`

#### Overrides

```ts
Error.constructor
```

## Properties

### revert?

```ts
optional revert: boolean;
```

Defined in: [packages/query-core/src/retryer.ts:78](https://github.com/TanStack/query/blob/main/packages/query-core/src/retryer.ts#L78)

***

### silent?

```ts
optional silent: boolean;
```

Defined in: [packages/query-core/src/retryer.ts:79](https://github.com/TanStack/query/blob/main/packages/query-core/src/retryer.ts#L79)
