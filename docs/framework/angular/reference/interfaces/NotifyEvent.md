---
id: NotifyEvent
title: NotifyEvent
---

Defined in: packages/query-core/dist-ts/src/types.d.ts:1836

The base shape of the events that the query and mutation caches send to their listeners.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-type"></a> `type` | \| `"added"` \| `"removed"` \| `"observerAdded"` \| `"observerRemoved"` \| `"observerOptionsUpdated"` \| `"updated"` \| `"observerResultsUpdated"` | The kind of event, e.g. `'added'`, `'removed'`, or `'updated'`. |
