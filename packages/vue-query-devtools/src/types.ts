import type {
  DevtoolsButtonPosition,
  DevtoolsErrorType,
  DevtoolsPosition,
  Theme,
} from '@tanstack/query-devtools'
import type { QueryClient } from '@tanstack/vue-query'

/**
 * The props of `VueQueryDevtools`, which renders the devtools with a toggle button that opens them.
 */
export interface DevtoolsOptions {
  /**
   * Set this true if you want the dev tools to default to being open
   */
  initialIsOpen?: boolean
  /**
   * The position of the TanStack logo to open and close the devtools panel.
   * 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'relative'
   * @defaultValue bottom-right
   */
  buttonPosition?: DevtoolsButtonPosition
  /**
   * The position of the Vue Query devtools panel.
   * 'top' | 'bottom' | 'left' | 'right'
   * @defaultValue bottom
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
   * Use this to pass a nonce to the `<style>` element that the devtools add in
   * browsers without constructable stylesheets, such as Safari before 16.4.
   * This is useful if you are using a Content Security Policy (CSP) nonce to
   * allow inline styles. Other browsers need no nonce.
   */
  styleNonce?: string
  /**
   * The shadow root to add the devtools styles to. By default, the styles are
   * added to the shadow root the devtools render in, or to the document when
   * they do not render in a shadow root.
   */
  shadowDOMTarget?: ShadowRoot
  /**
   * Set this to true to hide disabled queries from the devtools panel.
   */
  hideDisabledQueries?: boolean
  /**
   * Set this to 'light', 'dark', or 'system' to change the theme of the devtools panel.
   * This overrides the theme selected in the devtools Settings menu. When omitted, the
   * selected theme is used, or `'system'` if none is selected.
   */
  theme?: Theme
}

/**
 * The props of `VueQueryDevtoolsPanel`, which renders the devtools panel inline.
 */
export interface DevtoolsPanelOptions {
  /**
   * Custom instance of QueryClient
   */
  client?: QueryClient
  /**
   * Use this so you can define custom errors that can be shown in the devtools.
   */
  errorTypes?: Array<DevtoolsErrorType>
  /**
   * Use this to pass a nonce to the `<style>` element that the devtools add in
   * browsers without constructable stylesheets, such as Safari before 16.4.
   * This is useful if you are using a Content Security Policy (CSP) nonce to
   * allow inline styles. Other browsers need no nonce.
   */
  styleNonce?: string
  /**
   * The shadow root to add the devtools styles to. By default, the styles are
   * added to the shadow root the devtools render in, or to the document when
   * they do not render in a shadow root.
   */
  shadowDOMTarget?: ShadowRoot

  /**
   * Custom styles for the devtools panel
   * @default { height: '100%', display: 'flex', flexDirection: 'column' }
   * @example { height: '100%' }
   * @example { height: '100%', width: '100%' }
   */
  style?: Partial<CSSStyleDeclaration>

  /**
   * Callback function that is called when the devtools panel is closed
   */
  onClose?: () => void
  /**
   * Set this to true to hide disabled queries from the devtools panel.
   */
  hideDisabledQueries?: boolean
  /**
   * Set this to 'light', 'dark', or 'system' to change the theme of the devtools panel.
   * This overrides the theme selected in the devtools Settings menu. When omitted, the
   * selected theme is used, or `'system'` if none is selected.
   */
  theme?: Theme
}
