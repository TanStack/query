/**
 * A function that returns whether the code is running on the server.
 */
export type IsServerValue = () => boolean

const defaultIsServer = typeof window === 'undefined' || 'Deno' in globalThis

let isServerFn: IsServerValue = () => defaultIsServer

/**
 * Returns whether the current runtime should be treated as a server environment.
 * @returns `true` if the runtime is treated as a server.
 */
export const isServer = (): boolean => isServerFn()

/**
 * Manages how TanStack Query detects whether the current runtime should be treated as
 * server-side. The default timeout provider skips timers on the server.
 * By default, a missing `window` or the
 * presence of a `Deno` global indicates a server environment.
 *
 * Override this for runtimes where that default detection would give the wrong answer — for
 * example, a Service Worker, where `window` is undefined even though the environment should
 * behave like a client.
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
   * @param isServerValue - A function that returns whether the runtime should be treated as a
   * server.
   */
  setIsServer(isServerValue: IsServerValue): void {
    isServerFn = isServerValue
  },
}
