import type { Logger } from './logger'

/**
 * See https://github.com/tannerlinsley/react-query/issues/795
 * and https://github.com/tannerlinsley/react-query/pull/3246/#discussion_r795105707
 */
export const defaultLogger: Logger = {
  log: console.log,
  warn: console.warn,
  error: console.warn,
}
