---
id: Accessor
title: Accessor
---

# Type Alias: Accessor\<T\>

```ts
type Accessor<T> = T | () => T;
```

Defined in: [packages/lit-query/src/accessor.ts:13](https://github.com/TanStack/query/blob/main/packages/lit-query/src/accessor.ts#L13)

A value that can be passed directly or read from a zero-argument getter.

Lit Query APIs read function accessors during host updates, so the getter can
depend on reactive host state.

## Type Parameters

### T

`T`

## Example

```ts
const staticKey: Accessor<readonly unknown[]> = ['todos']
const reactiveKey: Accessor<readonly unknown[]> = () => ['todos', this.userId]
```
