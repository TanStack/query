---
id: FocusManager
title: FocusManager
---

Defined in: [packages/query-core/src/focusManager.ts:14](https://github.com/TanStack/query/blob/main/packages/query-core/src/focusManager.ts#L14)

The `FocusManager` manages the focus state within TanStack Query.

It can be used to change the default event listeners or to manually change the focus state.

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

### isFocused()

```ts
isFocused(): boolean;
```

Defined in: [packages/query-core/src/focusManager.ts:128](https://github.com/TanStack/query/blob/main/packages/query-core/src/focusManager.ts#L128)

`isFocused` can be used to get the current focus state.

#### Returns

`boolean`

***

### onFocus()

```ts
onFocus(): void;
```

Defined in: [packages/query-core/src/focusManager.ts:118](https://github.com/TanStack/query/blob/main/packages/query-core/src/focusManager.ts#L118)

`onFocus` notifies all subscribed listeners with the current focus state.

#### Returns

`void`

***

### onSubscribe()

```ts
protected onSubscribe(): void;
```

Defined in: [packages/query-core/src/focusManager.ts:39](https://github.com/TanStack/query/blob/main/packages/query-core/src/focusManager.ts#L39)

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

Defined in: [packages/query-core/src/focusManager.ts:45](https://github.com/TanStack/query/blob/main/packages/query-core/src/focusManager.ts#L45)

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

Defined in: [packages/query-core/src/focusManager.ts:77](https://github.com/TanStack/query/blob/main/packages/query-core/src/focusManager.ts#L77)

`setEventListener` can be used to set a custom event listener that will
be used to determine the focus state. The provided `setup` function
receives a `setFocused` callback: call it with a `boolean` to manually
set the focus state, or with no arguments to re-evaluate the current
focus state and notify subscribers.

#### Parameters

##### setup

`SetupFn`

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
setFocused(focused?): void;
```

Defined in: [packages/query-core/src/focusManager.ts:107](https://github.com/TanStack/query/blob/main/packages/query-core/src/focusManager.ts#L107)

`setFocused` can be used to manually set the focus state. Set `undefined`
to fall back to the default focus check.

#### Parameters

##### focused?

`boolean`

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
