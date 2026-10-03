---
id: FocusManager
title: FocusManager
---

Defined in: [packages/query-core/src/focusManager.ts:14](https://github.com/TanStack/query/blob/main/packages/query-core/src/focusManager.ts#L14)

The `FocusManager` manages the focus state within TanStack Query.

It can be used to change the default event listeners or to manually change the focus state.

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

### isFocused()

```ts
isFocused(): boolean;
```

Defined in: [packages/query-core/src/focusManager.ts:130](https://github.com/TanStack/query/blob/main/packages/query-core/src/focusManager.ts#L130)

`isFocused` can be used to get the current focus state.

#### Returns

`boolean`

The focus state set with `setFocused`, or otherwise whether the document is visible.

***

### onFocus()

```ts
onFocus(): void;
```

Defined in: [packages/query-core/src/focusManager.ts:119](https://github.com/TanStack/query/blob/main/packages/query-core/src/focusManager.ts#L119)

`onFocus` notifies all subscribed listeners with the current focus state.

#### Returns

`void`

***

### setEventListener()

```ts
setEventListener(setup: SetupFn): void;
```

Defined in: [packages/query-core/src/focusManager.ts:78](https://github.com/TanStack/query/blob/main/packages/query-core/src/focusManager.ts#L78)

`setEventListener` can be used to set a custom event listener that will
be used to determine the focus state. The provided `setup` function
receives a `setFocused` callback: call it with a `boolean` to manually
set the focus state, or with no arguments to re-evaluate the current
focus state and notify subscribers.

#### Parameters

##### setup

`SetupFn`

Receives the `setFocused` callback, registers the event listener, and may return
a cleanup function that is called when the listener is replaced or no longer needed.

#### Returns

`void`

#### Example

```ts
import { focusManager } from '@tanstack/query-core'

focusManager.setEventListener((handleFocus) => {
  const listener = () => handleFocus()
  // Listen to visibilitychange
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('visibilitychange', listener, false)
  }

  return () => {
    // Be sure to unsubscribe if a new handler is set
    window.removeEventListener('visibilitychange', listener)
  }
})
```

***

### setFocused()

```ts
setFocused(focused?: boolean): void;
```

Defined in: [packages/query-core/src/focusManager.ts:108](https://github.com/TanStack/query/blob/main/packages/query-core/src/focusManager.ts#L108)

`setFocused` can be used to manually set the focus state. Set `undefined`
to fall back to the default focus check.

#### Parameters

##### focused?

`boolean`

The focus state, or `undefined` to use the default focus check.

#### Returns

`void`

#### Example

```ts
import { focusManager } from '@tanstack/query-core'

// Set focused
focusManager.setFocused(true)

// Set unfocused
focusManager.setFocused(false)

// Fallback to the default focus check
focusManager.setFocused(undefined)
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
