import { isServer as defaultIsServer } from './utils'

export type IsServerValue = () => boolean

let isServerFn: IsServerValue = () => defaultIsServer

/**
 * Returns whether the current runtime should be treated as a server environment.
 */
export const isServer = (): boolean => isServerFn()

/**
 * Manages environment detection used by TanStack Query internals.
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
