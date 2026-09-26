---
id: SetDataOptions
title: SetDataOptions
---

Defined in: [packages/query-core/src/types.ts:1649](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L1649)

Options for writing data into the cache, e.g. via `queryClient.setQueryData()`.
`updatedAt` overrides the timestamp the data is recorded with, which is what staleness is measured from;
omit it to use the current time.

## Properties

| Property | Type |
| ------ | ------ |
| <a id="updatedat"></a> `updatedAt?` | `number` |
