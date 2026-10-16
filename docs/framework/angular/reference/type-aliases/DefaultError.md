---
id: DefaultError
title: DefaultError
---

```ts
type DefaultError = Register extends object ? TError : Error;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:55

The error type used wherever an error is not given an explicit type parameter.
Defaults to `Error`; declare `defaultError` on [Register](../interfaces/Register.md) to change it everywhere at once.
