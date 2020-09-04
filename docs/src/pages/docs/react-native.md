---
id: react-native
title: React Native
---

When using React Query on React Native you may face the following error:

> React Native throws fullscreen error when promises are rejected

This is happening because by default React Query uses `console.error` to log promise rejection.

To fix this issue you can replace `console.error` with `console.warn` using [setConsole](https://react-query.tanstack.com/docs/api#setconsole).

```js
import { setConsole } from 'react-query'

setConsole({
  log: console.log,
  warn: console.warn,
  error: console.warn,
})
```
