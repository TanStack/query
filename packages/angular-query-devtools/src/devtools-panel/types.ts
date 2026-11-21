import type { ElementRef } from '@angular/core'
import type { QueryClient } from '@tanstack/angular-query'
import type { DevtoolsErrorType, Theme } from '@tanstack/query-devtools'

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
   * The theme of the devtools panel. Overrides the theme selected in the devtools
   * Settings menu. When omitted, the selected theme is used, or `'system'` if none
   * is selected.
   */
  theme?: Theme
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
