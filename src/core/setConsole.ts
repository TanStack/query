import { noop } from './utils'

// TYPES

type ConsoleFunction = (...args: any[]) => void

export interface ConsoleObject {
  log: ConsoleFunction
  warn: ConsoleFunction
  error: ConsoleFunction
}

// FUNCTIONS

let consoleObject: ConsoleObject = console || {
  error: noop,
  warn: noop,
  log: noop,
}

export function getConsole(): ConsoleObject {
  return consoleObject
}

export function setConsole(c: ConsoleObject) {
  consoleObject = c
}
