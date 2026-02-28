import { isServer } from './utils'

type IsServerValue = boolean | (() => boolean)

/**
 * Manages environment detection used by TanStack Query internals.
 */
export class EnvironmentManager {
  #isServer: () => boolean

  constructor() {
    this.#isServer = () => isServer
  }

  /**
   * Returns whether the current runtime should be treated as a server environment.
   */
  isServer(): boolean {
    return this.#isServer()
  }

  /**
   * Overrides the server check globally.
   * Accepts either a boolean value or a function that returns a boolean.
   */
  setIsServer(isServerValue: IsServerValue): void {
    this.#isServer =
      typeof isServerValue === 'function' ? isServerValue : () => isServerValue
  }
}

/**
 * Global manager instance for environment detection.
 */
export const environmentManager = new EnvironmentManager()
