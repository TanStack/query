---
id: DefaultError
title: DefaultError
---

```ts
type DefaultError = Register extends {
  defaultError: infer TError;
} ? TError : Error;
```

Defined in: [packages/query-core/src/types.ts:82](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L82)

The error type used wherever an error is not given an explicit type parameter.
Defaults to `Error`; declare `defaultError` on [Register](../interfaces/Register.md) to change it everywhere at once.
