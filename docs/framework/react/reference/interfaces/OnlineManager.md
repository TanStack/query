---
id: OnlineManager
title: OnlineManager
redirect_from:
  - reference/onlineManager
  - framework/react/reference/onlineManager
---

Defined in: [packages/query-core/src/onlineManager.ts:15](https://github.com/TanStack/query/blob/main/packages/query-core/src/onlineManager.ts#L15)

The `OnlineManager` manages the online state within TanStack Query. It can
be used to change the default event listeners or to manually change the
online state.

By default, the `onlineManager` assumes an active network connection, and
listens to the `online` and `offline` events on the `window` object to
detect changes.

## Extends

- `Subscribable`\<`Listener`\>

## Methods

### hasListeners()

```ts
hasListeners(): boolean;
```

Defined in: [packages/query-core/src/subscribable.ts:43](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L43)

Returns `true` while at least one listener is registered, `false` once they have all unsubscribed.

#### Returns

`boolean`

`true` if at least one listener is registered.

#### Inherited from

```ts
Subscribable.hasListeners
```

***

### isOnline()

```ts
isOnline(): boolean;
```

Defined in: [packages/query-core/src/onlineManager.ts:111](https://github.com/TanStack/query/blob/main/packages/query-core/src/onlineManager.ts#L111)

`isOnline` can be used to get the current online state.

#### Returns

`boolean`

`true` if online.

***

### setEventListener()

```ts
setEventListener(setup: SetupFn): void;
```

Defined in: [packages/query-core/src/onlineManager.ts:76](https://github.com/TanStack/query/blob/main/packages/query-core/src/onlineManager.ts#L76)

`setEventListener` can be used to set a custom event listener that will
be used to determine the online state. The provided `setup` function
receives a `setOnline` callback that should be called with a `boolean`
whenever the online state changes.

#### Parameters

##### setup

`SetupFn`

Receives the `setOnline` callback, registers the event listener, and may return
a cleanup function that is called when the listener is replaced or no longer needed.

#### Returns

`void`

#### Example

```ts
import NetInfo from '@react-native-community/netinfo'
import { onlineManager } from '@tanstack/query-core'

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected)
  })
})
```

***

### setOnline()

```ts
setOnline(online: boolean): void;
```

Defined in: [packages/query-core/src/onlineManager.ts:96](https://github.com/TanStack/query/blob/main/packages/query-core/src/onlineManager.ts#L96)

`setOnline` can be used to manually set the online state.

#### Parameters

##### online

`boolean`

The online state.

#### Returns

`void`

#### Example

```ts
import { onlineManager } from '@tanstack/query-core'

// Set to online
onlineManager.setOnline(true)

// Set to offline
onlineManager.setOnline(false)
```

***

### subscribe()

```ts
subscribe(listener: Listener): () => void;
```

Defined in: [packages/query-core/src/subscribable.ts:28](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L28)

Registers a listener to be called on every update this object notifies about. Returns a function
that removes the listener again — call it to stop listening. The base class never drops a listener
on its own, though some subclasses clear all of theirs in `destroy()`.

#### Parameters

##### listener

`Listener`

Called on each update, with whatever the subclass passes to its subscribers.

#### Returns

A function that removes the listener.

```ts
(): void;
```

##### Returns

`void`

#### Example

```ts
const unsubscribe = subscribable.subscribe(() => {
  // react to the update
})

unsubscribe()
```

#### Inherited from

```ts
Subscribable.subscribe
```
