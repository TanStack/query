---
id: ValueAccessor
title: ValueAccessor
---

# Type Alias: ValueAccessor\<T\>

```ts
type ValueAccessor<T> = () => T & object;
```

Defined in: [packages/lit-query/src/accessor.ts:32](https://github.com/TanStack/query/blob/main/packages/lit-query/src/accessor.ts#L32)

A callable accessor with a `current` property for reading the latest
controller result.

Controller creators and cache state helpers return this shape so render code
can use either `result()` or `result.current`.

## Type Declaration

### current

```ts
readonly current: T;
```

## Type Parameters

### T

`T`

## Example

```ts
const query = this.todos()
const sameQuery = this.todos.current
```
