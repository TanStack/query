import type { QueryClient } from '@tanstack/query-core'
import type {
  DevtoolsButtonPosition,
  DevtoolsErrorType,
  DevtoolsPosition,
} from '@tanstack/query-devtools'
import type { DevtoolsFeature } from '../providers'

/**
 * Options for configuring withDevtools.
 */
export interface WithDevtoolsOptions {
  /**
   * An array of dependencies to be injected and passed to the `withDevtoolsFn` function.
   *
   * **Example**
   * ```ts
   * export const appConfig: ApplicationConfig = {
   *   providers: [
   *     provideTanStackQuery(
   *       new QueryClient(),
   *       withDevtools(
   *         (devToolsOptionsManager: DevtoolsOptionsManager) => ({
   *           loadDevtools: devToolsOptionsManager.loadDevtools(),
   *         }),
   *         {
   *           deps: [DevtoolsOptionsManager],
   *         },
   *       ),
   *     ),
   *   ],
   * }
   * ```
   */
  deps?: Array<any>
}

/**
 * Options for configuring the TanStack Query devtools.
 */
export interface DevtoolsOptions {
  /**
   * Set this true if you want the devtools to default to being open
   */
  initialIsOpen?: boolean
  /**
   * The position of the TanStack logo to open and close the devtools panel.
   * `top-left` | `top-right` | `bottom-left` | `bottom-right` | `relative`
   * Defaults to `bottom-right`.
   */
  buttonPosition?: DevtoolsButtonPosition
  /**
   * The position of the TanStack Query devtools panel.
   * `top` | `bottom` | `left` | `right`
   * Defaults to `bottom`.
   */
  position?: DevtoolsPosition
  /**
   * Custom instance of QueryClient
   */
  client?: QueryClient
  /**
   * Use this so you can define custom errors that can be shown in the devtools.
   */
  errorTypes?: Array<DevtoolsErrorType>
  /**
   * Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
   */
  styleNonce?: string
  /**
   * Use this so you can attach the devtool's styles to a specific element in the DOM.
   */
  shadowDOMTarget?: ShadowRoot

  /**
   * Whether the developer tools should load.
   * - `auto`- (Default) Lazily loads devtools when in development mode. Skips loading in production mode.
   * - `true`- Always load the devtools, regardless of the environment.
   * - `false`- Never load the devtools, regardless of the environment.
   *
   * You can use `true` and `false` to override loading developer tools from an environment file.
   * For example, a test environment might run in production mode but you may want to load developer tools.
   *
   * Additionally, you can use a signal in the callback to dynamically load the devtools based on a condition. For example,
   * a signal created from a RxJS observable that listens for a keyboard shortcut.
   *
   * **Example**
   * ```ts
   *    withDevtools(() => ({
   *      initialIsOpen: true,
   *      loadDevtools: inject(ExampleService).loadDevtools()
   *    }))
   *  ```
   */
  loadDevtools?: 'auto' | boolean
}

export type WithDevtoolsFn = (...deps: Array<any>) => DevtoolsOptions

export type WithDevtools = (
  withDevtoolsFn?: WithDevtoolsFn,
  options?: WithDevtoolsOptions,
) => DevtoolsFeature
