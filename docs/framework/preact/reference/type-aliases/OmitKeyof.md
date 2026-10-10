---
id: OmitKeyof
title: OmitKeyof
---

```ts
type OmitKeyof<TObject, TKey, TStrictly> = Omit<TObject, TKey>;
```

Defined in: [packages/query-core/src/types.ts:30](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L30)

Like `Omit`, but by default (`'strictly'`) `TKey` must be a key of `TObject`, so omitting a key
that doesn't exist is a type error. Pass `'safely'` to allow other keys too.

## Type Parameters

### TObject

`TObject`

### TKey

`TKey` *extends* `TStrictly` *extends* `"safely"` ? 
  \| keyof `TObject`
  \| `string` & `Record`\<`never`, `never`\>
  \| `number` & `Record`\<`never`, `never`\>
  \| `symbol` & `Record`\<`never`, `never`\> : keyof `TObject`

### TStrictly

`TStrictly` *extends* `"strictly"` \| `"safely"` = `"strictly"`
