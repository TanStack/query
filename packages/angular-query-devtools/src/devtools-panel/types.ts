import type { DevtoolsErrorType } from '@tanstack/query-devtools'
import type { ElementRef, Injector } from '@angular/core'
import type { QueryClient } from '@tanstack/query-core'

export interface InjectDevtoolsPanelOptions {
  /**
   * The `Injector` in which to create the devtools panel.
   *
   * If this is not provided, the current injection context will be used instead (via `inject`).
   */
  injector?: Injector
}

/**
 * A devtools panel, which can be manually destroyed.
 */
export interface DevtoolsPanelRef {
  /**
   * Destroy the panel, removing it from the DOM and stops listening to signal changes.
   */
  destroy: () => void
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
   * Callback function that is called when the devtools panel is closed
   */
  onClose?: () => unknown

  /**
   * Element where to render the devtools panel. When set to undefined or null, the devtools panel will not be created, or destroyed if existing.
   * If changed from undefined to a ElementRef, the devtools panel will be created.
   */
  hostElement?: ElementRef
}

export type InjectDevtoolsPanel = (
  injectDevtoolsPanelFn: () => DevtoolsPanelOptions,
  options?: InjectDevtoolsPanelOptions,
) => DevtoolsPanelRef
