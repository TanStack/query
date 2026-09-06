import { isServer as defaultIsServer } from './utils'

export type IsServerValue = () => boolean

let isServerFn: IsServerValue = () => defaultIsServer

/**
 * Returns whether the current runtime should be treated as a server environment.
 */
export const isServer = (): boolean => isServerFn()

/**
 * Manages how TanStack Query detects whether the current runtime should be treated as
 * server-side. By default, this uses the same detection as the exported `isServer` utility.
 *
 * Override this for runtimes that are not traditional browser/server environments (e.g.
 * extension workers), where the default detection would give the wrong answer.
 *
 * @example
 * ```ts
 * import { environmentManager, isServer } from '@tanstack/query-core'
 *
 * environmentManager.setIsServer(() => typeof window === 'undefined' && !('chrome' in globalThis))
 *
 * // Restore the default behavior:
 * environmentManager.setIsServer(() => isServer)
 * ```
 */
export const environmentManager = {
  isServer,
  /**
   * Overrides the server check globally.
   */
  setIsServer(isServerValue: IsServerValue): void {
    isServerFn = isServerValue
  },
}
