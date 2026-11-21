import type { Signal } from '@angular/core'
import type { QueryClient, QueryFeature } from '@tanstack/angular-query'
import type {
  DevtoolsButtonPosition,
  DevtoolsErrorType,
  DevtoolsPosition,
  Theme,
} from '@tanstack/query-devtools'

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
   * The shadow root to add the devtools styles to. By default, the styles are
   * added to the shadow root the devtools render in, or to the document when
   * they do not render in a shadow root.
   */
  shadowDOMTarget?: ShadowRoot
  /**
   * The Trusted Types policy the devtools use to create their HTML templates.
   * Pass one when your page enforces `require-trusted-types-for 'script'`.
   * The devtools only pass it their own markup.
   */
  trustedTypesPolicy?: { createHTML: (html: string) => unknown }
  /**
   * Set this to true to hide disabled queries from the devtools panel.
   */
  hideDisabledQueries?: boolean
  /**
   * Set this to 'light', 'dark', or 'system' to change the theme of the devtools panel.
   * This overrides the theme selected in the devtools Settings menu. When omitted, the
   * selected theme is used, or `'system'` if none is selected.
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
 * mutable options reactive. `shadowDOMTarget`,
 * `trustedTypesPolicy`, and `hideDisabledQueries` are read only when the
 * devtools are constructed.
 */
export type WithDevtoolsFn = () => DevtoolsOptions

/**
 * Creates a Query feature from an optional factory of developer-tools options.
 */
export type WithDevtools = (withDevtoolsFn?: WithDevtoolsFn) => QueryFeature
