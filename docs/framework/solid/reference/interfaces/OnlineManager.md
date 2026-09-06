---
id: OnlineManager
title: OnlineManager
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

## Properties

### listeners

```ts
protected listeners: Set<Listener>;
```

Defined in: [packages/query-core/src/subscribable.ts:2](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L2)

#### Inherited from

```ts
Subscribable.listeners
```

## Methods

### hasListeners()

```ts
hasListeners(): boolean;
```

Defined in: [packages/query-core/src/subscribable.ts:19](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L19)

#### Returns

`boolean`

#### Inherited from

```ts
Subscribable.hasListeners
```

***

### isOnline()

```ts
isOnline(): boolean;
```

Defined in: [packages/query-core/src/onlineManager.ts:109](https://github.com/TanStack/query/blob/main/packages/query-core/src/onlineManager.ts#L109)

`isOnline` can be used to get the current online state.

#### Returns

`boolean`

***

### onSubscribe()

```ts
protected onSubscribe(): void;
```

Defined in: [packages/query-core/src/onlineManager.ts:44](https://github.com/TanStack/query/blob/main/packages/query-core/src/onlineManager.ts#L44)

#### Returns

`void`

#### Overrides

```ts
Subscribable.onSubscribe
```

***

### onUnsubscribe()

```ts
protected onUnsubscribe(): void;
```

Defined in: [packages/query-core/src/onlineManager.ts:50](https://github.com/TanStack/query/blob/main/packages/query-core/src/onlineManager.ts#L50)

#### Returns

`void`

#### Overrides

```ts
Subscribable.onUnsubscribe
```

***

### setEventListener()

```ts
setEventListener(setup): void;
```

Defined in: [packages/query-core/src/onlineManager.ts:75](https://github.com/TanStack/query/blob/main/packages/query-core/src/onlineManager.ts#L75)

`setEventListener` can be used to set a custom event listener that will
be used to determine the online state. The provided `setup` function
receives a `setOnline` callback that should be called with a `boolean`
whenever the online state changes.

#### Parameters

##### setup

`SetupFn`

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
setOnline(online): void;
```

Defined in: [packages/query-core/src/onlineManager.ts:95](https://github.com/TanStack/query/blob/main/packages/query-core/src/onlineManager.ts#L95)

`setOnline` can be used to manually set the online state.

#### Parameters

##### online

`boolean`

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
subscribe(listener): () => void;
```

Defined in: [packages/query-core/src/subscribable.ts:8](https://github.com/TanStack/query/blob/main/packages/query-core/src/subscribable.ts#L8)

#### Parameters

##### listener

`Listener`

#### Returns

```ts
(): void;
```

##### Returns

`void`

#### Inherited from

```ts
Subscribable.subscribe
```
