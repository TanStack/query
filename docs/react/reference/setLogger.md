---
id: setLogger
title: setLogger
---

## `setLogger`

`setLogger` is an optional function that allows you to replace the default `logger` used by React Query to log errors. By default, the `window.console` object is used. If no global `console` object is found in the environment, nothing will be logged.

Examples:

```js
import { setLogger } from 'react-query'
import { printLog, printWarn, printError } from 'custom-logger'

// Custom logger
setLogger({
  log: printLog,
  warn: printWarn,
  error: printError,
})

// Sentry logger
setLogger({
  log: message => {
    Sentry.captureMessage(message)
  },
  warn: message => {
    Sentry.captureMessage(message)
  },
  error: error => {
    Sentry.captureException(error)
  },
})

// Winston logger
setLogger(winston.createLogger())
```

**Options**

- `logger: Logger`
  - Must implement the `log`, `warn`, and `error` methods.
