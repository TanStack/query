import type {
  DevtoolsButtonPosition,
  DevtoolsErrorType,
  DevtoolsPosition,
} from '@tanstack/query-devtools'
import type { QueryClient } from '@tanstack/vue-query'
import type { CSSProperties } from 'vue'

export interface DevtoolsOptions {
  /**
   * Set this true if you want the dev tools to default to being open.
   */
  initialIsOpen?: boolean
  /**
   * The position of the Vue Query logo to open and close the devtools panel.
   * 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'relative'
   * @default 'bottom-right'
   */
  buttonPosition?: DevtoolsButtonPosition
  /**
   * The position of the React Query devtools panel.
   * 'top' | 'bottom' | 'left' | 'right'
   * @default 'bottom'
   */
  position?: DevtoolsPosition
  /**
   * Custom instance of QueryClient.
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
   * Use this so you can attach the devtool's styles to specific element in the DOM.
   */
  shadowDOMTarget?: ShadowRoot
}

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
   * Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
   */
  styleNonce?: string
  /**
   * Use this so you can attach the devtool's styles to specific element in the DOM.
   */
  shadowDOMTarget?: ShadowRoot
  /**
   * Custom styles for the devtools panel.
   * @default { height: '500px' }
   * @example { height: '100%' }
   * @example { height: '100%', width: '100%' }
   */
  style?: CSSProperties
  /**
   * Callback function that is called when the devtools panel is closed.
   */
  onClose?: () => unknown
}
