import type { DevtoolsErrorType, Theme } from '@tanstack/query-devtools'
import type { ElementRef } from '@angular/core'
import type { QueryClient } from '@tanstack/query-core'

/**
 * A devtools panel, which can be manually destroyed.
 */
export interface DevtoolsPanelRef {
  /**
   * Destroy the panel, removing it from the DOM and stops listening to signal changes.
   */
  destroy: () => void
}

/**
 * Options for the devtools panel, returned by the function passed to `injectDevtoolsPanel`.
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
   * The theme of the devtools panel.
   * @default 'system'
   */
  theme?: Theme
  /**
   * Use this to pass a nonce to the style tag that is added to the document head. This is useful if you are using a Content Security Policy (CSP) nonce to allow inline styles.
   */
  styleNonce?: string
  /**
   * Use this to pass a shadow DOM target to the devtools so that the styles will be applied
   * within the shadow DOM instead of within the head tag in the light DOM.
   */
  shadowDOMTarget?: ShadowRoot

  /**
   * Callback function that is called when the devtools panel is closed
   */
  onClose?: () => unknown

  /**
   * Element where to render the devtools panel. When set to undefined or null, the devtools panel will not be created, or destroyed if existing.
   * If changed from undefined to an ElementRef, the devtools panel will be created.
   */
  hostElement?: ElementRef | null
}

/**
 * The signature of `injectDevtoolsPanel`, which creates a devtools panel from reactive options.
 */
export type InjectDevtoolsPanel = (
  injectDevtoolsPanelFn: () => DevtoolsPanelOptions,
) => DevtoolsPanelRef
