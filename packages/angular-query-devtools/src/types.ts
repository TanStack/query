import type { QueryClient } from '@tanstack/query-core'
import type {
  DevtoolsButtonPosition,
  DevtoolsErrorType,
  DevtoolsPosition,
  Theme,
} from '@tanstack/query-devtools'
import type { QueryFeature } from '@tanstack/angular-query'
import type { Signal } from '@angular/core'

/** A static devtools option or an Angular signal containing that option. */
type MaybeSignal<T> = T | Signal<T | undefined>

/**
 * Options for configuring the TanStack Query devtools.
 */
export interface DevtoolsOptions {
  /**
   * Set this true if you want the devtools to default to being open
   */
  initialIsOpen?: MaybeSignal<boolean>
  /**
   * The position of the TanStack logo to open and close the devtools panel.
   * `top-left` | `top-right` | `bottom-left` | `bottom-right` | `relative`
   * Defaults to `bottom-right`.
   */
  buttonPosition?: MaybeSignal<DevtoolsButtonPosition>
  /**
   * The position of the TanStack Query devtools panel.
   * `top` | `bottom` | `left` | `right`
   * Defaults to `bottom`.
   */
  position?: MaybeSignal<DevtoolsPosition>
  /**
   * Custom instance of QueryClient
   */
  client?: MaybeSignal<QueryClient>
  /**
   * Use this so you can define custom errors that can be shown in the devtools.
   */
  errorTypes?: MaybeSignal<Array<DevtoolsErrorType>>
  /**
   * Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
   */
  styleNonce?: string
  /**
   * Use this so you can attach the devtool's styles to a specific element in the DOM.
   */
  shadowDOMTarget?: ShadowRoot
  /**
   * Set this to true to hide disabled queries from the devtools panel.
   */
  hideDisabledQueries?: boolean
  /**
   * Set this to 'light', 'dark', or 'system' to change the theme of the devtools panel.
   * Defaults to 'system'.
   */
  theme?: MaybeSignal<Theme>

  /**
   * Whether the developer tools should be rendered.
   * - `auto`- (Default) Renders devtools in development mode. Skips rendering in production mode.
   * - `true`- Always render the devtools, regardless of the environment.
   * - `false`- Never render the devtools, regardless of the environment.
   *
   * You can use `true` and `false` to override loading developer tools from an environment file.
   * For example, a test environment might run in production mode but you may want to load developer tools.
   *
   * You can pass a signal to dynamically render the devtools based on a
   * condition. For example, the signal could be created from an RxJS
   * observable that listens for a keyboard shortcut.
   *
   * **Example**
   * ```ts
   * withDevtools(() => ({
   *   initialIsOpen: true,
   *   loadDevtools: inject(ExampleService).loadDevtools,
   * }))
   * ```
   */
  loadDevtools?: MaybeSignal<'auto' | boolean>
}

/**
 * Returns devtools options. The function runs once in an Angular injection
 * context, so it can call `inject()`. Pass signals as option values to make
 * mutable options reactive. `styleNonce`, `shadowDOMTarget`, and
 * `hideDisabledQueries` are read only when the devtools are constructed.
 */
export type WithDevtoolsFn = () => DevtoolsOptions

export type WithDevtools = (withDevtoolsFn?: WithDevtoolsFn) => QueryFeature
