---
id: NotifyEvent
title: NotifyEvent
---

Defined in: [packages/query-core/src/types.ts:2428](https://github.com/TanStack/query/blob/main/packages/query-core/src/types.ts#L2428)

The base shape of the events that the query and mutation caches send to their listeners.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-type"></a> `type` | \| `"added"` \| `"removed"` \| `"updated"` \| `"observerAdded"` \| `"observerRemoved"` \| `"observerResultsUpdated"` \| `"observerOptionsUpdated"` | The kind of event, e.g. `'added'`, `'removed'`, or `'updated'`. |
