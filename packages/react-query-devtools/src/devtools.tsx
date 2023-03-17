'use client'
import * as React from 'react'
import type { QueryClient } from '@tanstack/react-query'
import useLocalStorage from './useLocalStorage'
import {
  isVerticalSide,
  useIsMounted,
  getSidePanelStyle,
  minPanelSize,
  getSidedProp,
  defaultPanelSize,
} from './utils'
import type { Corner, Side } from './utils'
import ScreenReader from './screenreader'
import { ThemeProvider, defaultTheme as theme } from './theme'
import Logo from './Logo'

import type { DevToolsErrorType } from './types'
import ReactQueryDevtoolsPanel from './CachePanel/CachePanel'

export { default as ReactQueryDevtoolsPanel } from './CachePanel/CachePanel'

export interface DevtoolsOptions {
  /**
   * Set this true if you want the dev tools to default to being open
   */
  initialIsOpen?: boolean
  /**
   * Use this to add props to the panel. For example, you can add className, style (merge and override default style), etc.
   */
  panelProps?: React.ComponentPropsWithoutRef<'div'>
  /**
   * Use this to add props to the close button. For example, you can add className, style (merge and override default style), onClick (extend default handler), etc.
   */
  closeButtonProps?: React.ComponentPropsWithoutRef<'button'>
  /**
   * Use this to add props to the toggle button. For example, you can add className, style (merge and override default style), onClick (extend default handler), etc.
   */
  toggleButtonProps?: React.ComponentPropsWithoutRef<'button'>
  /**
   * The position of the React Query logo to open and close the devtools panel.
   * Defaults to 'bottom-left'.
   */
  position?: Corner
  /**
   * The position of the React Query devtools panel.
   * Defaults to 'bottom'.
   */
  panelPosition?: Side
  /**
   * Use this to render the devtools inside a different type of container element for a11y purposes.
   * Any string which corresponds to a valid intrinsic JSX element is allowed.
   * Defaults to 'aside'.
   */
  containerElement?: string | any
  /**
   * nonce for style element for CSP
   */
  styleNonce?: string
  /**
   * Custom instance of QueryClient
   */
  queryClient?: QueryClient
  /**
   * Use this so you can define custom errors that can be shown in the devtools.
   */
  errorTypes?: DevToolsErrorType[]
}

export function ReactQueryDevtools({
  initialIsOpen,
  panelProps = {},
  closeButtonProps = {},
  toggleButtonProps = {},
  position = 'bottom-left',
  containerElement: Container = 'aside',
  queryClient,
  styleNonce,
  panelPosition: initialPanelPosition = 'bottom',
  errorTypes = [],
}: DevtoolsOptions): React.ReactElement | null {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useLocalStorage(
    'reactQueryDevtoolsOpen',
    initialIsOpen,
  )
  const [devtoolsHeight, setDevtoolsHeight] = useLocalStorage<number>(
    'reactQueryDevtoolsHeight',
    defaultPanelSize,
  )
  const [devtoolsWidth, setDevtoolsWidth] = useLocalStorage<number>(
    'reactQueryDevtoolsWidth',
    defaultPanelSize,
  )

  const [panelPosition = 'bottom', setPanelPosition] = useLocalStorage<Side>(
    'reactQueryDevtoolsPanelPosition',
    initialPanelPosition,
  )

  const [isResolvedOpen, setIsResolvedOpen] = React.useState(false)
  const [isResizing, setIsResizing] = React.useState(false)
  const isMounted = useIsMounted()

  const handleDragStart = (
    panelElement: HTMLDivElement | null,
    startEvent: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (!panelElement) return
    if (startEvent.button !== 0) return // Only allow left click for drag
    const isVertical = isVerticalSide(panelPosition)
    setIsResizing(true)

    const { height, width } = panelElement.getBoundingClientRect()
    const startX = startEvent.clientX
    const startY = startEvent.clientY
    let newSize = 0

    const run = (moveEvent: MouseEvent) => {
      // prevent mouse selecting stuff with mouse drag
      moveEvent.preventDefault()

      // calculate the correct size based on mouse position and current panel position
      // hint: it is different formula for the opposite sides
      if (isVertical) {
        newSize =
          width +
          (panelPosition === 'right'
            ? startX - moveEvent.clientX
            : moveEvent.clientX - startX)
        setDevtoolsWidth(newSize)
      } else {
        newSize =
          height +
          (panelPosition === 'bottom'
            ? startY - moveEvent.clientY
            : moveEvent.clientY - startY)
        setDevtoolsHeight(newSize)
      }

      if (newSize < minPanelSize) {
        setIsOpen(false)
      } else {
        setIsOpen(true)
      }
    }

    const unsub = () => {
      if (isResizing) {
        setIsResizing(false)
      }

      document.removeEventListener('mousemove', run, false)
      document.removeEventListener('mouseUp', unsub, false)
    }

    document.addEventListener('mousemove', run, false)
    document.addEventListener('mouseup', unsub, false)
  }

  React.useEffect(() => {
    setIsResolvedOpen(isOpen ?? false)
  }, [isOpen, isResolvedOpen, setIsResolvedOpen])

  // Toggle panel visibility before/after transition (depending on direction).
  // Prevents focusing in a closed panel.
  React.useEffect(() => {
    const ref = panelRef.current
    if (ref) {
      const handlePanelTransitionStart = () => {
        if (isResolvedOpen) {
          ref.style.visibility = 'visible'
        }
      }

      const handlePanelTransitionEnd = () => {
        if (!isResolvedOpen) {
          ref.style.visibility = 'hidden'
        }
      }

      ref.addEventListener('transitionstart', handlePanelTransitionStart)
      ref.addEventListener('transitionend', handlePanelTransitionEnd)

      return () => {
        ref.removeEventListener('transitionstart', handlePanelTransitionStart)
        ref.removeEventListener('transitionend', handlePanelTransitionEnd)
      }
    }
    return
  }, [isResolvedOpen])

  React.useEffect(() => {
    if (isResolvedOpen && rootRef.current?.parentElement) {
      const { parentElement } = rootRef.current
      const styleProp = getSidedProp('padding', panelPosition)
      const isVertical = isVerticalSide(panelPosition)

      const previousPaddings = (({
        padding,
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
      }) => ({
        padding,
        paddingTop,
        paddingBottom,
        paddingLeft,
        paddingRight,
      }))(parentElement.style)

      const run = () => {
        // reset the padding
        parentElement.style.padding = '0px'
        parentElement.style.paddingTop = '0px'
        parentElement.style.paddingBottom = '0px'
        parentElement.style.paddingLeft = '0px'
        parentElement.style.paddingRight = '0px'
        // set the new padding based on the new panel position

        parentElement.style[styleProp] = `${
          isVertical ? devtoolsWidth : devtoolsHeight
        }px`
      }

      run()

      if (typeof window !== 'undefined') {
        window.addEventListener('resize', run)

        return () => {
          window.removeEventListener('resize', run)
          Object.entries(previousPaddings).forEach(
            ([property, previousValue]) => {
              parentElement.style[property as keyof typeof previousPaddings] =
                previousValue
            },
          )
        }
      }
    }
    return
  }, [isResolvedOpen, panelPosition, devtoolsHeight, devtoolsWidth])

  const { style: panelStyle = {}, ...otherPanelProps } = panelProps

  const {
    style: toggleButtonStyle = {},
    onClick: onToggleClick,
    ...otherToggleButtonProps
  } = toggleButtonProps

  // get computed style based on panel position
  const style = getSidePanelStyle({
    position: panelPosition,
    devtoolsTheme: theme,
    isOpen: isResolvedOpen,
    height: devtoolsHeight,
    width: devtoolsWidth,
    isResizing,
    panelStyle,
  })

  // Do not render on the server
  if (!isMounted()) return null

  return (
    <Container
      ref={rootRef}
      className="ReactQueryDevtools"
      aria-label="React Query Devtools"
    >
      <ThemeProvider theme={theme}>
        <ReactQueryDevtoolsPanel
          ref={panelRef as any}
          queryClient={queryClient}
          styleNonce={styleNonce}
          position={panelPosition}
          onPositionChange={setPanelPosition}
          showCloseButton
          closeButtonProps={closeButtonProps}
          {...otherPanelProps}
          style={style}
          isOpen={isResolvedOpen}
          setIsOpen={setIsOpen}
          onDragStart={(e) => handleDragStart(panelRef.current, e)}
          errorTypes={errorTypes}
        />
      </ThemeProvider>
      {!isResolvedOpen ? (
        <button
          type="button"
          {...otherToggleButtonProps}
          aria-label="Open React Query Devtools"
          aria-controls="ReactQueryDevtoolsPanel"
          aria-haspopup="true"
          aria-expanded="false"
          onClick={(e) => {
            setIsOpen(true)
            onToggleClick?.(e)
          }}
          style={{
            background: 'none',
            border: 0,
            padding: 0,
            position: 'fixed',
            zIndex: 99999,
            display: 'inline-flex',
            fontSize: '1.5em',
            margin: '.5em',
            cursor: 'pointer',
            width: 'fit-content',
            ...(position === 'top-right'
              ? {
                  top: '0',
                  right: '0',
                }
              : position === 'top-left'
              ? {
                  top: '0',
                  left: '0',
                }
              : position === 'bottom-right'
              ? {
                  bottom: '0',
                  right: '0',
                }
              : {
                  bottom: '0',
                  left: '0',
                }),
            ...toggleButtonStyle,
          }}
        >
          <Logo aria-hidden />
          <ScreenReader text="Open React Query Devtools" />
        </button>
      ) : null}
    </Container>
  )
}
