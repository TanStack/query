import { isServer } from './utils'

export type IsServerValue = () => boolean

/**
 * Manages environment detection used by TanStack Query internals.
 */
export const environmentManager = (() => {
  let isServerFn: IsServerValue = () => isServer

  return {
    /**
     * Returns whether the current runtime should be treated as a server environment.
     */
    isServer(): boolean {
      return isServerFn()
    },
    /**
     * Overrides the server check globally.
     */
    setIsServer(isServerValue: IsServerValue): void {
      isServerFn = isServerValue
    },
  }
})()
