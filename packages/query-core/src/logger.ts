export interface Logger {
  log: LogFunction
  warn: LogFunction
  error: LogFunction
}

type LogFunction = (...args: any[]) => void

export const defaultLogger: Logger = console
