'use client'
import * as React from 'react'
import { useSyncExternalStore } from './useSyncExternalStore'
import type {
  QueryCache,
  QueryClient,
  QueryKey as QueryKeyType,
  ContextOptions,
  Query,
} from '@tanstack/react-query'
import {
  useQueryClient,
  onlineManager,
  notifyManager,
} from '@tanstack/react-query'
import { rankItem } from '@tanstack/match-sorter-utils'
import useLocalStorage from './useLocalStorage'
import {
  isVerticalSide,
  sortFns,
  useIsMounted,
  getSidePanelStyle,
  minPanelSize,
  getResizeHandleStyle,
  getSidedProp,
  defaultPanelSize,
  displayValue,
} from './utils'
import type { Corner, Side } from './utils'
import {
  Panel,
  QueryKeys,
  QueryKey,
  Button,
  Code,
  Input,
  Select,
  ActiveQueryPanel,
} from './styledComponents'
import ScreenReader from './screenreader'
import { ThemeProvider, defaultTheme as theme } from './theme'
import { getQueryStatusLabel, getQueryStatusColor } from './utils'
import Explorer from './Explorer'
import Logo from './Logo'
import { useMemo } from 'react'

export interface DevToolsErrorType {
  /**
   * The name of the error.
   */
  name: string
  /**
   * How the error is initialized. Whatever it returns MUST implement toString() so
   * we can check against the current error.
   */
  initializer: (query: Query) => { toString(): string }
}

export interface DevtoolsOptions extends ContextOptions {
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
   * Use this so you can define custom errors that can be shown in the devtools.
   */
  errorTypes?: DevToolsErrorType[]
}

interface DevtoolsPanelOptions extends ContextOptions {
  /**
   * The standard React style object used to style a component with inline styles
   */
  style?: React.CSSProperties
  /**
   * The standard React className property used to style a component with classes
   */
  className?: string
  /**
   * A boolean variable indicating whether the panel is open or closed
   */
  isOpen?: boolean
  /**
   * nonce for style element for CSP
   */
  styleNonce?: string
  /**
   * A function that toggles the open and close state of the panel
   */
  setIsOpen: (isOpen: boolean) => void
  /**
   * Handles the opening and closing the devtools panel
   */
  onDragStart: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
  /**
   * The position of the React Query devtools panel.
   * Defaults to 'bottom'.
   */
  position?: Side
  /**
   * Handles the panel position select change
   */
  onPositionChange?: (side: Side) => void
  /**
   * Show a close button inside the panel
   */
  showCloseButton?: boolean
  /**
   * Use this to add props to the close button. For example, you can add className, style (merge and override default style), onClick (extend default handler), etc.
   */
  closeButtonProps?: React.ComponentPropsWithoutRef<'button'>
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
  context,
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
          context={context}
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

const useSubscribeToQueryCache = <T,>(
  queryCache: QueryCache,
  getSnapshot: () => T,
  skip: boolean = false,
): T => {
  return useSyncExternalStore(
    React.useCallback(
      (onStoreChange) => {
        if (!skip)
          return queryCache.subscribe(notifyManager.batchCalls(onStoreChange))
        return () => {
          return
        }
      },
      [queryCache, skip],
    ),
    getSnapshot,
    getSnapshot,
  )
}

export const ReactQueryDevtoolsPanel = React.forwardRef<
  HTMLDivElement,
  DevtoolsPanelOptions
>(function ReactQueryDevtoolsPanel(props, ref): React.ReactElement {
  const {
    isOpen = true,
    styleNonce,
    setIsOpen,
    context,
    onDragStart,
    onPositionChange,
    showCloseButton,
    position,
    closeButtonProps = {},
    errorTypes = [],
    ...panelProps
  } = props

  const { onClick: onCloseClick, ...otherCloseButtonProps } = closeButtonProps

  const queryClient = useQueryClient({ context })
  const queryCache = queryClient.getQueryCache()

  const [sort, setSort] = useLocalStorage(
    'reactQueryDevtoolsSortFn',
    Object.keys(sortFns)[0],
  )

  const [filter, setFilter] = useLocalStorage('reactQueryDevtoolsFilter', '')

  const [baseSort, setBaseSort] = useLocalStorage(
    'reactQueryDevtoolsBaseSort',
    1,
  )

  const sortFn = React.useMemo(() => sortFns[sort as string], [sort])

  const queriesCount = useSubscribeToQueryCache(
    queryCache,
    () => queryCache.getAll().length,
    !isOpen,
  )

  const [activeQueryHash, setActiveQueryHash] = useLocalStorage(
    'reactQueryDevtoolsActiveQueryHash',
    '',
  )

  const queries = React.useMemo(() => {
    const unsortedQueries = queryCache.getAll()

    if (queriesCount === 0) {
      return []
    }

    const filtered = filter
      ? unsortedQueries.filter(
          (item) => rankItem(item.queryHash, filter).passed,
        )
      : [...unsortedQueries]

    const sorted = sortFn
      ? filtered.sort((a, b) => sortFn(a, b) * (baseSort as number))
      : filtered

    return sorted
  }, [baseSort, sortFn, filter, queriesCount, queryCache])

  const [isMockOffline, setMockOffline] = React.useState(false)

  return (
    <ThemeProvider theme={theme}>
      <Panel
        ref={ref}
        className="ReactQueryDevtoolsPanel"
        aria-label="React Query Devtools Panel"
        id="ReactQueryDevtoolsPanel"
        {...panelProps}
        style={{
          height: defaultPanelSize,
          position: 'relative',
          ...panelProps.style,
        }}
      >
        <style
          nonce={styleNonce}
          dangerouslySetInnerHTML={{
            __html: `
            .ReactQueryDevtoolsPanel * {
              scrollbar-color: ${theme.backgroundAlt} ${theme.gray};
            }

            .ReactQueryDevtoolsPanel *::-webkit-scrollbar, .ReactQueryDevtoolsPanel scrollbar {
              width: 1em;
              height: 1em;
            }

            .ReactQueryDevtoolsPanel *::-webkit-scrollbar-track, .ReactQueryDevtoolsPanel scrollbar-track {
              background: ${theme.backgroundAlt};
            }

            .ReactQueryDevtoolsPanel *::-webkit-scrollbar-thumb, .ReactQueryDevtoolsPanel scrollbar-thumb {
              background: ${theme.gray};
              border-radius: .5em;
              border: 3px solid ${theme.backgroundAlt};
            }
          `,
          }}
        />
        <div
          style={getResizeHandleStyle(position)}
          onMouseDown={onDragStart}
        ></div>

        {isOpen && (
          <div
            style={{
              flex: '1 1 500px',
              minHeight: '40%',
              maxHeight: '100%',
              overflow: 'auto',
              borderRight: `1px solid ${theme.grayAlt}`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                padding: '.5em',
                background: theme.backgroundAlt,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <button
                type="button"
                aria-label="Close React Query Devtools"
                aria-controls="ReactQueryDevtoolsPanel"
                aria-haspopup="true"
                aria-expanded="true"
                onClick={() => setIsOpen(false)}
                style={{
                  display: 'inline-flex',
                  background: 'none',
                  border: 0,
                  padding: 0,
                  marginRight: '.5em',
                  cursor: 'pointer',
                }}
              >
                <Logo aria-hidden />
                <ScreenReader text="Close React Query Devtools" />
              </button>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '.5em',
                  }}
                >
                  <QueryStatusCount queryCache={queryCache} />
                  {position && onPositionChange ? (
                    <Select
                      aria-label="Panel position"
                      value={position}
                      style={{ marginInlineStart: '.5em' }}
                      onChange={(e) => onPositionChange(e.target.value as Side)}
                    >
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                    </Select>
                  ) : null}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5em',
                  }}
                >
                  <Input
                    placeholder="Filter"
                    aria-label="Filter by queryhash"
                    value={filter ?? ''}
                    onChange={(e) => setFilter(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setFilter('')
                    }}
                    style={{
                      flex: '1',
                      width: '100%',
                    }}
                  />
                  <Select
                    aria-label="Sort queries"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    style={{
                      flex: '1',
                      minWidth: 75,
                      marginRight: '.5em',
                    }}
                  >
                    {Object.keys(sortFns).map((key) => (
                      <option key={key} value={key}>
                        Sort by {key}
                      </option>
                    ))}
                  </Select>
                  <Button
                    type="button"
                    onClick={() => setBaseSort((old) => old * -1)}
                    style={{
                      padding: '.3em .4em',
                      marginRight: '.5em',
                    }}
                  >
                    {baseSort === 1 ? '⬆ Asc' : '⬇ Desc'}
                  </Button>
                  <Button
                    title="Clear cache"
                    aria-label="Clear cache"
                    type="button"
                    onClick={() => queryCache.clear()}
                    style={{
                      padding: '.3em .4em',
                      marginRight: '.5em',
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (isMockOffline) {
                        onlineManager.setOnline(undefined)
                        setMockOffline(false)
                        window.dispatchEvent(new Event('online'))
                      } else {
                        onlineManager.setOnline(false)
                        setMockOffline(true)
                      }
                    }}
                    aria-label={
                      isMockOffline
                        ? 'Restore offline mock'
                        : 'Mock offline behavior'
                    }
                    title={
                      isMockOffline
                        ? 'Restore offline mock'
                        : 'Mock offline behavior'
                    }
                    style={{
                      padding: '0',
                      height: '2em',
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="2em"
                      height="2em"
                      viewBox="0 0 24 24"
                      stroke={isMockOffline ? theme.danger : 'currentColor'}
                      fill="none"
                    >
                      {isMockOffline ? (
                        <>
                          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                          <line x1="12" y1="18" x2="12.01" y2="18" />
                          <path d="M9.172 15.172a4 4 0 0 1 5.656 0" />
                          <path d="M6.343 12.343a7.963 7.963 0 0 1 3.864 -2.14m4.163 .155a7.965 7.965 0 0 1 3.287 2" />
                          <path d="M3.515 9.515a12 12 0 0 1 3.544 -2.455m3.101 -.92a12 12 0 0 1 10.325 3.374" />
                          <line x1="3" y1="3" x2="21" y2="21" />
                        </>
                      ) : (
                        <>
                          <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                          <line x1="12" y1="18" x2="12.01" y2="18" />
                          <path d="M9.172 15.172a4 4 0 0 1 5.656 0" />
                          <path d="M6.343 12.343a8 8 0 0 1 11.314 0" />
                          <path d="M3.515 9.515c4.686 -4.687 12.284 -4.687 17 0" />
                        </>
                      )}
                    </svg>
                    <ScreenReader
                      text={
                        isMockOffline
                          ? 'Restore offline mock'
                          : 'Mock offline behavior'
                      }
                    />
                  </Button>
                </div>
              </div>
            </div>
            <div
              style={{
                overflowY: 'auto',
                flex: '1',
              }}
            >
              {queries.map((query) => {
                return (
                  <QueryRow
                    queryKey={query.queryKey}
                    activeQueryHash={activeQueryHash}
                    setActiveQueryHash={setActiveQueryHash}
                    key={query.queryHash}
                    queryCache={queryCache}
                  />
                )
              })}
            </div>
          </div>
        )}

        {activeQueryHash && isOpen ? (
          <ActiveQuery
            activeQueryHash={activeQueryHash}
            queryCache={queryCache}
            queryClient={queryClient}
            errorTypes={errorTypes}
          />
        ) : null}

        {showCloseButton ? (
          <Button
            type="button"
            aria-controls="ReactQueryDevtoolsPanel"
            aria-haspopup="true"
            aria-expanded="true"
            {...(otherCloseButtonProps as Record<string, unknown>)}
            style={{
              position: 'absolute',
              zIndex: 99999,
              margin: '.5em',
              bottom: 0,
              left: 0,
              ...otherCloseButtonProps.style,
            }}
            onClick={(e) => {
              setIsOpen(false)
              onCloseClick?.(e)
            }}
          >
            Close
          </Button>
        ) : null}
      </Panel>
    </ThemeProvider>
  )
})

const ActiveQuery = ({
  queryCache,
  activeQueryHash,
  queryClient,
  errorTypes,
}: {
  queryCache: QueryCache
  activeQueryHash: string
  queryClient: QueryClient
  errorTypes: DevToolsErrorType[]
}) => {
  const activeQuery = useSubscribeToQueryCache(queryCache, () =>
    queryCache.getAll().find((query) => query.queryHash === activeQueryHash),
  )

  const activeQueryState = useSubscribeToQueryCache(
    queryCache,
    () =>
      queryCache.getAll().find((query) => query.queryHash === activeQueryHash)
        ?.state,
  )

  const isStale =
    useSubscribeToQueryCache(queryCache, () =>
      queryCache
        .getAll()
        .find((query) => query.queryHash === activeQueryHash)
        ?.isStale(),
    ) ?? false

  const observerCount =
    useSubscribeToQueryCache(queryCache, () =>
      queryCache
        .getAll()
        .find((query) => query.queryHash === activeQueryHash)
        ?.getObserversCount(),
    ) ?? 0

  const handleRefetch = () => {
    const promise = activeQuery?.fetch()
    promise?.catch(noop)
  }

  const currentErrorTypeName = useMemo(() => {
    if (activeQuery && activeQueryState?.error) {
      const errorType = errorTypes.find(
        (type) =>
          type.initializer(activeQuery).toString() ===
          activeQueryState.error?.toString(),
      )
      return errorType?.name
    }
    return undefined
  }, [activeQuery, activeQueryState?.error, errorTypes])

  if (!activeQuery || !activeQueryState) {
    return null
  }

  const triggerError = (errorType?: DevToolsErrorType) => {
    const error =
      errorType?.initializer(activeQuery) ??
      new Error('Unknown error from devtools')

    const __previousQueryOptions = activeQuery.options

    activeQuery.setState({
      status: 'error',
      error,
      fetchMeta: {
        ...activeQuery.state.fetchMeta,
        __previousQueryOptions,
      },
    })
  }

  const restoreQueryAfterLoadingOrError = () => {
    activeQuery.fetch(activeQuery.state.fetchMeta.__previousQueryOptions, {
      // Make sure this fetch will cancel the previous one
      cancelRefetch: true,
    })
  }

  return (
    <ActiveQueryPanel>
      <div
        style={{
          padding: '.5em',
          background: theme.backgroundAlt,
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        Query Details
      </div>
      <div
        style={{
          padding: '.5em',
        }}
      >
        <div
          style={{
            marginBottom: '.5em',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
          }}
        >
          <Code
            style={{
              lineHeight: '1.8em',
            }}
          >
            <pre
              style={{
                margin: 0,
                padding: 0,
                overflow: 'auto',
              }}
            >
              {displayValue(activeQuery.queryKey, true)}
            </pre>
          </Code>
          <span
            style={{
              padding: '0.3em .6em',
              borderRadius: '0.4em',
              fontWeight: 'bold',
              textShadow: '0 2px 10px black',
              background: getQueryStatusColor({
                queryState: activeQueryState,
                isStale: isStale,
                observerCount: observerCount,
                theme,
              }),
              flexShrink: 0,
            }}
          >
            {getQueryStatusLabel(activeQuery)}
          </span>
        </div>
        <div
          style={{
            marginBottom: '.5em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          Observers: <Code>{observerCount}</Code>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          Last Updated:{' '}
          <Code>
            {new Date(activeQueryState.dataUpdatedAt).toLocaleTimeString()}
          </Code>
        </div>
      </div>
      <div
        style={{
          background: theme.backgroundAlt,
          padding: '.5em',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        Actions
      </div>
      <div
        style={{
          padding: '0.5em',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5em',
          alignItems: 'flex-end',
        }}
      >
        <Button
          type="button"
          onClick={handleRefetch}
          disabled={activeQueryState.fetchStatus === 'fetching'}
          style={{
            background: theme.active,
          }}
        >
          Refetch
        </Button>{' '}
        <Button
          type="button"
          onClick={() => queryClient.invalidateQueries(activeQuery)}
          style={{
            background: theme.warning,
            color: theme.inputTextColor,
          }}
        >
          Invalidate
        </Button>{' '}
        <Button
          type="button"
          onClick={() => queryClient.resetQueries(activeQuery)}
          style={{
            background: theme.gray,
          }}
        >
          Reset
        </Button>{' '}
        <Button
          type="button"
          onClick={() => queryClient.removeQueries(activeQuery)}
          style={{
            background: theme.danger,
          }}
        >
          Remove
        </Button>{' '}
        <Button
          type="button"
          onClick={() => {
            if (activeQuery.state.data === undefined) {
              restoreQueryAfterLoadingOrError()
            } else {
              const __previousQueryOptions = activeQuery.options
              // Trigger a fetch in order to trigger suspense as well.
              activeQuery.fetch({
                ...__previousQueryOptions,
                queryFn: () => {
                  return new Promise(() => {
                    // Never resolve
                  })
                },
                cacheTime: -1,
              })
              activeQuery.setState({
                data: undefined,
                status: 'loading',
                fetchMeta: {
                  ...activeQuery.state.fetchMeta,
                  __previousQueryOptions,
                },
              })
            }
          }}
          style={{
            background: theme.paused,
          }}
        >
          {activeQuery.state.status === 'loading' ? 'Restore' : 'Trigger'}{' '}
          loading
        </Button>{' '}
        {errorTypes.length === 0 || activeQuery.state.status === 'error' ? (
          <Button
            type="button"
            onClick={() => {
              if (!activeQuery.state.error) {
                triggerError()
              } else {
                queryClient.resetQueries(activeQuery)
              }
            }}
            style={{
              background: theme.danger,
            }}
          >
            {activeQuery.state.status === 'error' ? 'Restore' : 'Trigger'} error
          </Button>
        ) : (
          <label>
            Trigger error:
            <Select
              value={currentErrorTypeName ?? ''}
              style={{ marginInlineStart: '.5em' }}
              onChange={(e) => {
                const errorType = errorTypes.find(
                  (t) => t.name === e.target.value,
                )

                triggerError(errorType)
              }}
            >
              <option key="" value="" />
              {errorTypes.map((errorType) => (
                <option key={errorType.name} value={errorType.name}>
                  {errorType.name}
                </option>
              ))}
            </Select>
          </label>
        )}
      </div>
      <div
        style={{
          background: theme.backgroundAlt,
          padding: '.5em',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        Data Explorer
      </div>
      <div
        style={{
          padding: '.5em',
        }}
      >
        <Explorer
          label="Data"
          value={activeQueryState.data}
          defaultExpanded={{}}
          copyable
        />
      </div>
      <div
        style={{
          background: theme.backgroundAlt,
          padding: '.5em',
          position: 'sticky',
          top: 0,
          zIndex: 1,
        }}
      >
        Query Explorer
      </div>
      <div
        style={{
          padding: '.5em',
        }}
      >
        <Explorer
          label="Query"
          value={activeQuery}
          defaultExpanded={{
            queryKey: true,
          }}
        />
      </div>
    </ActiveQueryPanel>
  )
}

const QueryStatusCount = ({ queryCache }: { queryCache: QueryCache }) => {
  const hasFresh = useSubscribeToQueryCache(
    queryCache,
    () =>
      queryCache.getAll().filter((q) => getQueryStatusLabel(q) === 'fresh')
        .length,
  )
  const hasFetching = useSubscribeToQueryCache(
    queryCache,
    () =>
      queryCache.getAll().filter((q) => getQueryStatusLabel(q) === 'fetching')
        .length,
  )
  const hasPaused = useSubscribeToQueryCache(
    queryCache,
    () =>
      queryCache.getAll().filter((q) => getQueryStatusLabel(q) === 'paused')
        .length,
  )
  const hasStale = useSubscribeToQueryCache(
    queryCache,
    () =>
      queryCache.getAll().filter((q) => getQueryStatusLabel(q) === 'stale')
        .length,
  )
  const hasInactive = useSubscribeToQueryCache(
    queryCache,
    () =>
      queryCache.getAll().filter((q) => getQueryStatusLabel(q) === 'inactive')
        .length,
  )
  return (
    <QueryKeys>
      <QueryKey
        style={{
          background: theme.success,
          opacity: hasFresh ? 1 : 0.3,
        }}
      >
        fresh <Code>({hasFresh})</Code>
      </QueryKey>{' '}
      <QueryKey
        style={{
          background: theme.active,
          opacity: hasFetching ? 1 : 0.3,
        }}
      >
        fetching <Code>({hasFetching})</Code>
      </QueryKey>{' '}
      <QueryKey
        style={{
          background: theme.paused,
          opacity: hasPaused ? 1 : 0.3,
        }}
      >
        paused <Code>({hasPaused})</Code>
      </QueryKey>{' '}
      <QueryKey
        style={{
          background: theme.warning,
          color: 'black',
          textShadow: '0',
          opacity: hasStale ? 1 : 0.3,
        }}
      >
        stale <Code>({hasStale})</Code>
      </QueryKey>{' '}
      <QueryKey
        style={{
          background: theme.gray,
          opacity: hasInactive ? 1 : 0.3,
        }}
      >
        inactive <Code>({hasInactive})</Code>
      </QueryKey>
    </QueryKeys>
  )
}

interface QueryRowProps {
  queryKey: QueryKeyType
  setActiveQueryHash: (hash: string) => void
  activeQueryHash?: string
  queryCache: QueryCache
}

const QueryRow = React.memo(
  ({
    queryKey,
    setActiveQueryHash,
    activeQueryHash,
    queryCache,
  }: QueryRowProps) => {
    const queryHash =
      useSubscribeToQueryCache(
        queryCache,
        () => queryCache.find(queryKey)?.queryHash,
      ) ?? ''

    const queryState = useSubscribeToQueryCache(
      queryCache,
      () => queryCache.find(queryKey)?.state,
    )

    const isStale =
      useSubscribeToQueryCache(queryCache, () =>
        queryCache.find(queryKey)?.isStale(),
      ) ?? false

    const isDisabled =
      useSubscribeToQueryCache(queryCache, () =>
        queryCache.find(queryKey)?.isDisabled(),
      ) ?? false

    const observerCount =
      useSubscribeToQueryCache(queryCache, () =>
        queryCache.find(queryKey)?.getObserversCount(),
      ) ?? 0

    if (!queryState) {
      return null
    }

    return (
      <div
        role="button"
        aria-label={`Open query details for ${queryHash}`}
        onClick={() =>
          setActiveQueryHash(activeQueryHash === queryHash ? '' : queryHash)
        }
        style={{
          display: 'flex',
          borderBottom: `solid 1px ${theme.grayAlt}`,
          cursor: 'pointer',
          background:
            queryHash === activeQueryHash ? 'rgba(255,255,255,.1)' : undefined,
        }}
      >
        <div
          style={{
            flex: '0 0 auto',
            width: '2em',
            height: '2em',
            background: getQueryStatusColor({
              queryState,
              isStale,
              observerCount,
              theme,
            }),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            textShadow: isStale ? '0' : '0 0 10px black',
            color: isStale ? 'black' : 'white',
          }}
        >
          {observerCount}
        </div>
        {isDisabled ? (
          <div
            style={{
              flex: '0 0 auto',
              height: '2em',
              background: theme.gray,
              display: 'flex',
              alignItems: 'center',
              fontWeight: 'bold',
              padding: '0 0.5em',
            }}
          >
            disabled
          </div>
        ) : null}
        <Code
          style={{
            padding: '.5em',
          }}
        >
          {`${queryHash}`}
        </Code>
      </div>
    )
  },
)

QueryRow.displayName = 'QueryRow'

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop() {}
