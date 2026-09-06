---
id: OmitKeyof
title: OmitKeyof
---

```ts
type OmitKeyof<TObject, TKey, TStrictly> = Omit<TObject, TKey>;
```

Defined in: packages/query-core/dist-ts/src/types.d.ts:11

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
