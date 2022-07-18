import React from 'react'

import useLocalStorage from './useLocalStorage'
import { useIsMounted, useSafeState } from './utils'

import { Button } from './styledComponents'
import { ThemeProvider, defaultTheme as theme } from './theme'
import Logo from './Logo'

import ReactQueryDevtoolsPanel from './panel'

interface DevtoolsOptions {
  /**
   * Set this true if you want the dev tools to default to being open
   */
  initialIsOpen?: boolean
  /**
   * Use this to add props to the panel. For example, you can add className, style (merge and override default style), etc.
   */
  panelProps?: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >
  /**
   * Use this to add props to the close button. For example, you can add className, style (merge and override default style), onClick (extend default handler), etc.
   */
  closeButtonProps?: React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
  /**
   * Use this to add props to the toggle button. For example, you can add className, style (merge and override default style), onClick (extend default handler), etc.
   */
  toggleButtonProps?: React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
  /**
   * The position of the React Query logo to open and close the devtools panel.
   * Defaults to 'bottom-left'.
   */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
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
}

const isServer = typeof window === 'undefined'

export function ReactQueryDevtools({
  initialIsOpen,
  panelProps = {},
  closeButtonProps = {},
  toggleButtonProps = {},
  position = 'bottom-left',
  containerElement: Container = 'aside',
  styleNonce,
}: DevtoolsOptions): React.ReactElement | null {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useLocalStorage(
    'reactQueryDevtoolsOpen',
    initialIsOpen
  )
  const [devtoolsHeight, setDevtoolsHeight] = useLocalStorage<number | null>(
    'reactQueryDevtoolsHeight',
    null
  )
  const [isResolvedOpen, setIsResolvedOpen] = useSafeState(false)
  const [isResizing, setIsResizing] = useSafeState(false)
  const isMounted = useIsMounted()

  const handleDragStart = (
    panelElement: HTMLDivElement | null,
    startEvent: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    if (startEvent.button !== 0) return // Only allow left click for drag

    setIsResizing(true)

    const dragInfo = {
      originalHeight: panelElement?.getBoundingClientRect().height ?? 0,
      pageY: startEvent.pageY,
    }

    const run = (moveEvent: MouseEvent) => {
      const delta = dragInfo.pageY - moveEvent.pageY
      const newHeight = dragInfo?.originalHeight + delta

      setDevtoolsHeight(newHeight)

      if (newHeight < 70) {
        setIsOpen(false)
      } else {
        setIsOpen(true)
      }
    }

    const unsub = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', run)
      document.removeEventListener('mouseUp', unsub)
    }

    document.addEventListener('mousemove', run)
    document.addEventListener('mouseup', unsub)
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
        if (ref && isResolvedOpen) {
          ref.style.visibility = 'visible'
        }
      }

      const handlePanelTransitionEnd = () => {
        if (ref && !isResolvedOpen) {
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
  }, [isResolvedOpen])

  React[isServer ? 'useEffect' : 'useLayoutEffect'](() => {
    if (isResolvedOpen) {
      const previousValue = rootRef.current?.parentElement?.style.paddingBottom

      const run = () => {
        const containerHeight = panelRef.current?.getBoundingClientRect().height
        if (rootRef.current?.parentElement) {
          rootRef.current.parentElement.style.paddingBottom = `${containerHeight}px`
        }
      }

      run()

      if (typeof window !== 'undefined') {
        window.addEventListener('resize', run)

        return () => {
          window.removeEventListener('resize', run)
          if (
            rootRef.current?.parentElement &&
            typeof previousValue === 'string'
          ) {
            rootRef.current.parentElement.style.paddingBottom = previousValue
          }
        }
      }
    }
  }, [isResolvedOpen])

  const { style: panelStyle = {}, ...otherPanelProps } = panelProps

  const {
    style: closeButtonStyle = {},
    onClick: onCloseClick,
    ...otherCloseButtonProps
  } = closeButtonProps

  const {
    style: toggleButtonStyle = {},
    onClick: onToggleClick,
    ...otherToggleButtonProps
  } = toggleButtonProps

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
          styleNonce={styleNonce}
          {...otherPanelProps}
          style={{
            position: 'fixed',
            bottom: '0',
            right: '0',
            zIndex: 99999,
            width: '100%',
            height: devtoolsHeight ?? 500,
            maxHeight: '90%',
            boxShadow: '0 0 20px rgba(0,0,0,.3)',
            borderTop: `1px solid ${theme.gray}`,
            transformOrigin: 'top',
            // visibility will be toggled after transitions, but set initial state here
            visibility: isOpen ? 'visible' : 'hidden',
            ...panelStyle,
            ...(isResizing
              ? {
                  transition: `none`,
                }
              : { transition: `all .2s ease` }),
            ...(isResolvedOpen
              ? {
                  opacity: 1,
                  pointerEvents: 'all',
                  transform: `translateY(0) scale(1)`,
                }
              : {
                  opacity: 0,
                  pointerEvents: 'none',
                  transform: `translateY(15px) scale(1.02)`,
                }),
          }}
          isOpen={isResolvedOpen}
          setIsOpen={setIsOpen}
          handleDragStart={e => handleDragStart(panelRef.current, e)}
        />
        {isResolvedOpen ? (
          <Button
            type="button"
            aria-controls="ReactQueryDevtoolsPanel"
            aria-haspopup="true"
            aria-expanded="true"
            {...(otherCloseButtonProps as unknown)}
            onClick={e => {
              setIsOpen(false)
              onCloseClick && onCloseClick(e)
            }}
            style={{
              position: 'fixed',
              zIndex: 99999,
              margin: '.5em',
              bottom: 0,
              ...(position === 'top-right'
                ? {
                    right: '0',
                  }
                : position === 'top-left'
                ? {
                    left: '0',
                  }
                : position === 'bottom-right'
                ? {
                    right: '0',
                  }
                : {
                    left: '0',
                  }),
              ...closeButtonStyle,
            }}
          >
            Close
          </Button>
        ) : null}
      </ThemeProvider>
      {!isResolvedOpen ? (
        <button
          type="button"
          {...otherToggleButtonProps}
          aria-label="Open React Query Devtools"
          aria-controls="ReactQueryDevtoolsPanel"
          aria-haspopup="true"
          aria-expanded="false"
          onClick={e => {
            setIsOpen(true)
            onToggleClick && onToggleClick(e)
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
        </button>
      ) : null}
    </Container>
  )
}
