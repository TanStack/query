---
id: SetDataOptions
title: SetDataOptions
---

Defined in: packages/query-core/dist-ts/src/types.d.ts:1824

Options for writing data into the cache, e.g. via `queryClient.setQueryData()`.
`updatedAt` overrides the timestamp the data is recorded with, which is what staleness is measured from;
omit it to use the current time.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-updatedat"></a> `updatedAt?` | `number` | The timestamp to record the data with, instead of the current time. Staleness is measured from it. |
