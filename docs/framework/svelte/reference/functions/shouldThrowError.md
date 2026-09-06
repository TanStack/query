---
id: shouldThrowError
title: shouldThrowError
---

```ts
function shouldThrowError<T>(throwOnError, params): boolean;
```

Defined in: [packages/query-core/src/utils.ts:576](https://github.com/TanStack/query/blob/main/packages/query-core/src/utils.ts#L576)

Resolves a `throwOnError` option to a boolean.
If `throwOnError` is a function, it is called with `params` (e.g. the error and, depending on the caller,
additional context such as the query or mutation) and its result is returned, allowing the throwing
behavior to be decided per error. Otherwise, `throwOnError` itself is coerced to a boolean (`undefined`
resolves to `false`).

## Type Parameters

### T

`T` *extends* (...`args`) => `boolean`

## Parameters

### throwOnError

`boolean` | `T` | `undefined`

### params

`Parameters`\<`T`\>

## Returns

`boolean`

## Example

```ts
const throwOnError =
  query.state.error && typeof options.throwOnError === 'function'
    ? shouldThrowError(options.throwOnError, [query.state.error, query])
    : options.throwOnError
```
