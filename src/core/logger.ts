import { noop } from './utils'

// TYPES

export interface Logger {
  log: LogFunction
  warn: LogFunction
  error: LogFunction
}

type LogFunction = (...args: any[]) => void

// FUNCTIONS

let logger: Logger = console || {
  error: noop,
  warn: noop,
  log: noop,
}

export function getLogger(): Logger {
  return logger
}

export function setLogger(newLogger: Logger) {
  logger = newLogger
}
