import type { Logger } from '../core/logger'

export const logger: Logger = {
  log: console.log,
  warn: console.warn,
  error: console.warn,
}
