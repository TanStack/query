import type { Accessor, QueryClient } from '@tanstack/marko-query'
import type {
  DevtoolsButtonPosition,
  DevtoolsErrorType,
  DevtoolsPosition,
  Theme,
} from '@tanstack/query-devtools'

interface SharedOptions {
  /** The client to inspect instead of the one for this `$global`. */
  client?: Accessor<QueryClient>
  /**
   * Custom errors that can be triggered from the devtools. A function, as
   * each error's `initializer` is one, and Marko cannot serialize functions
   * in plain input.
   */
  errorTypes?: Accessor<Array<DevtoolsErrorType>>
  /** Nonce for the style tag added to the document head (CSP). */
  styleNonce?: string
  /**
   * The shadow root to put the styles in instead of the document head. A
   * function, as a shadow root only exists in the browser.
   */
  shadowDOMTarget?: Accessor<ShadowRoot>
  /** Hide disabled queries from the list. */
  hideDisabledQueries?: boolean
  /** `light`, `dark` or `system`. Defaults to `system`. */
  theme?: Theme
}

/** The options of `<query-devtools>`: the shared options and the button. */
export interface DevtoolsOptions extends SharedOptions {
  /** Open the devtools on first render. Defaults to `false`. */
  initialIsOpen?: boolean
  /** Where the toggle button sits. Defaults to `bottom-right`. */
  buttonPosition?: DevtoolsButtonPosition
  /** Where the panel docks. Defaults to `bottom`. */
  position?: DevtoolsPosition
}

/** The options of `<query-devtools-panel>`: the shared options and the panel. */
export interface DevtoolsPanelOptions extends SharedOptions {
  /** Style of the element the panel renders in. Defaults to `height: 500px`. */
  style?: Marko.HTML.Div['style']
  /** Called when the user closes the panel. */
  onClose?: () => void
}
