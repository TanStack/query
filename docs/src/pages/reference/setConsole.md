---
id: setConsole
title: setConsole
---

## `setConsole`

`setConsole` is an optional utility function that allows you to replace the `console` interface used to log errors. By default, the `window.console` object is used. If no global `console` object is found in the environment, nothing will be logged.

```js
import { setConsole } from 'react-query'
import { printLog, printWarn, printError } from 'custom-logger'

setConsole({
  log: printLog,
  warn: printWarn,
  error: printError,
})
```

**Options**

- `console: Object`
  - Must implement the `log`, `warn`, and `error` methods.
