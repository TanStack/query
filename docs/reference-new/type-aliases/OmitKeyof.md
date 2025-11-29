---
id: OmitKeyof
title: OmitKeyof
---

# Type Alias: OmitKeyof\<TObject, TKey, TStrictly\>

```ts
type OmitKeyof<TObject, TKey, TStrictly> = Omit<TObject, TKey>;
```

Defined in: [packages/query-core/src/types.ts:19](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L19)

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
