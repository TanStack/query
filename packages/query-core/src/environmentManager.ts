import { isServer as defaultIsServer } from './utils'

export type IsServerValue = () => boolean

let isServerFn: IsServerValue = () => defaultIsServer

/**
 * Returns whether the current runtime should be treated as a server environment.
 */
export const isServer = (): boolean => isServerFn()

/**
 * Manages how TanStack Query detects whether the current runtime should be treated as
 * server-side, which disables scheduling refetch timers and changes the default `retry` count
 * and `gcTime`. By default, the detection treats a missing `window` (or the presence of a
 * `Deno` global) as server.
 *
 * Override this for runtimes where that default detection would give the wrong answer — for
 * example, a Service Worker, where `window` is undefined even though the environment should
 * behave like a client.
 *
 * @example
 * ```ts
 * import { environmentManager } from '@tanstack/query-core'
 *
 * environmentManager.setIsServer(() => false)
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
