---
id: FocusManager
title: FocusManager
---

The `FocusManager` manages the focus state within React Query.

It can be used to change the default event listeners or to manually change the focus state.

Its available methods are:

- [`setEventListener`](#focusmanagerseteventlistener)
- [`setFocused`](#focusmanagersetfocused)
- [`isFocused`](#focusmanagerisfocused)

## `focusManager.setEventListener`

`setEventListener` can be used to set a custom event listener:

```js
import { focusManager } from 'react-query'

focusManager.setEventListener(handleFocus => {
  // Listen to visibillitychange and focus
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('visibilitychange', handleFocus, false)
    window.addEventListener('focus', handleFocus, false)
  }

  return () => {
    // Be sure to unsubscribe if a new handler is set
    window.removeEventListener('visibilitychange', handleFocus)
    window.removeEventListener('focus', handleFocus)
  }
})
```

## `focusManager.setFocused`

`setFocused` can be used to manually set the focus state. Set `undefined` to fallback to the default focus check.

```js
import { focusManager } from 'react-query'

// Set focused
focusManager.setFocused(true)

// Set unfocused
focusManager.setFocused(false)

// Fallback to the default focus check
focusManager.setFocused(undefined)
```

**Options**

- `focused: boolean | undefined`

## `focusManager.isFocused`

`isFocused` can be used to get the current focus state.

```js
const isFocused = focusManager.isFocused()
```
