'use client'
import { TanstackQueryDevtools } from '@tanstack/query-devtools'
import { onlineManager, useQueryClient } from '@tanstack/react-query'
import * as React from 'react'
import type {
  DevtoolsButtonPosition,
  DevtoolsErrorType,
  DevtoolsPosition,
  Theme,
} from '@tanstack/query-devtools'
import type { QueryClient } from '@tanstack/react-query'

/**
 * The props of `ReactQueryDevtools`, which renders the devtools with a toggle button that opens
 * them.
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
   * The position of the React Query devtools panel.
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
   * @deprecated The devtools no longer add a `<style>` element, so they need no
   * nonce. This option does nothing.
   */
  styleNonce?: string
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
  theme?: Theme
}

/**
 * Renders the TanStack Query devtools, with a toggle button that opens them, for the given or
 * nearest `QueryClient`.
 * @param props - The devtools options.
 * @returns The element the devtools are mounted in.
 */
export function ReactQueryDevtools(
  props: DevtoolsOptions,
): React.ReactElement | null {
  const queryClient = useQueryClient(props.client)
  const ref = React.useRef<HTMLDivElement>(null)
  const {
    buttonPosition,
    position,
    initialIsOpen,
    errorTypes,
    shadowDOMTarget,
    trustedTypesPolicy,
    hideDisabledQueries,
    theme,
  } = props
  const [devtools] = React.useState(
    () =>
      new TanstackQueryDevtools({
        client: queryClient,
        queryFlavor: 'React Query',
        version: '5',
        onlineManager,
        buttonPosition,
        position,
        initialIsOpen,
        errorTypes,
        shadowDOMTarget,
        trustedTypesPolicy,
        hideDisabledQueries,
        theme,
      }),
  )

  React.useEffect(() => {
    devtools.setClient(queryClient)
  }, [queryClient, devtools])

  React.useEffect(() => {
    if (buttonPosition) {
      devtools.setButtonPosition(buttonPosition)
    }
  }, [buttonPosition, devtools])

  React.useEffect(() => {
    if (position) {
      devtools.setPosition(position)
    }
  }, [position, devtools])

  React.useEffect(() => {
    devtools.setInitialIsOpen(initialIsOpen || false)
  }, [initialIsOpen, devtools])

  React.useEffect(() => {
    devtools.setErrorTypes(errorTypes || [])
  }, [errorTypes, devtools])

  React.useEffect(() => {
    devtools.setTheme(theme)
  }, [theme, devtools])

  React.useEffect(() => {
    if (ref.current) {
      devtools.mount(ref.current)
    }

    return () => {
      devtools.unmount()
    }
  }, [devtools])

  return <div className="tsqd-parent-container" ref={ref}></div>
}
