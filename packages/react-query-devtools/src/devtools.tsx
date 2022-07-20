import * as React from 'react'
import { useSyncExternalStore } from 'use-sync-external-store/shim'
import {
  useQueryClient,
  onlineManager,
  notifyManager,
  QueryCache,
  QueryClient,
  QueryKey as QueryKeyType,
  ContextOptions,
} from '@tanstack/react-query'
import { rankItem, compareItems } from '@tanstack/match-sorter-utils'
import useLocalStorage from './useLocalStorage'
import { sortFns, useIsMounted } from './utils'

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
import { ThemeProvider, defaultTheme as theme } from './theme'
import { getQueryStatusLabel, getQueryStatusColor } from './utils'
import Explorer from './Explorer'
import Logo from './Logo'

export interface DevtoolsOptions extends ContextOptions {
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
  handleDragStart: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
}

const isServer = typeof window === 'undefined'

export function ReactQueryDevtools({
  initialIsOpen,
  panelProps = {},
  closeButtonProps = {},
  toggleButtonProps = {},
  position = 'bottom-left',
  containerElement: Container = 'aside',
  context,
  styleNonce,
}: DevtoolsOptions): React.ReactElement | null {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useLocalStorage(
    'reactQueryDevtoolsOpen',
    initialIsOpen,
  )
  const [devtoolsHeight, setDevtoolsHeight] = useLocalStorage<number | null>(
    'reactQueryDevtoolsHeight',
    null,
  )
  const [isResolvedOpen, setIsResolvedOpen] = React.useState(false)
  const [isResizing, setIsResizing] = React.useState(false)
  const isMounted = useIsMounted()

  const handleDragStart = (
    panelElement: HTMLDivElement | null,
    startEvent: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (startEvent.button !== 0) return // Only allow left click for drag

    setIsResizing(true)

    const dragInfo = {
      originalHeight: panelElement?.getBoundingClientRect().height ?? 0,
      pageY: startEvent.pageY,
    }

    const run = (moveEvent: MouseEvent) => {
      const delta = dragInfo.pageY - moveEvent.pageY
      const newHeight = dragInfo.originalHeight + delta

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
          context={context}
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
          handleDragStart={(e) => handleDragStart(panelRef.current, e)}
        />
        {isResolvedOpen ? (
          <Button
            type="button"
            aria-controls="ReactQueryDevtoolsPanel"
            aria-haspopup="true"
            aria-expanded="true"
            {...(otherCloseButtonProps as Record<string, unknown>)}
            onClick={(e) => {
              setIsOpen(false)
              onCloseClick?.(e)
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
        </button>
      ) : null}
    </Container>
  )
}

const useSubscribeToQueryCache = <T,>(
  queryCache: QueryCache,
  getSnapshot: () => T,
): T => {
  return useSyncExternalStore(
    React.useCallback(
      (onStoreChange) =>
        queryCache.subscribe(notifyManager.batchCalls(onStoreChange)),
      [queryCache],
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
    handleDragStart,
    context,
    ...panelProps
  } = props

  const queryClient = useQueryClient({ context })
  const queryCache = queryClient.getQueryCache()

  const [sort, setSort] = useLocalStorage(
    'reactQueryDevtoolsSortFn',
    Object.keys(sortFns)[0],
  )

  const [filter, setFilter] = useLocalStorage('reactQueryDevtoolsFilter', '')

  const [sortDesc, setSortDesc] = useLocalStorage(
    'reactQueryDevtoolsSortDesc',
    false,
  )

  const sortFn = React.useMemo(() => sortFns[sort as string], [sort])

  const queriesCount = useSubscribeToQueryCache(
    queryCache,
    () => queryCache.getAll().length,
  )

  const [activeQueryHash, setActiveQueryHash] = useLocalStorage(
    'reactQueryDevtoolsActiveQueryHash',
    '',
  )

  const queries = React.useMemo(() => {
    const unsortedQueries = queryCache.getAll()
    const sorted = queriesCount > 0 ? [...unsortedQueries].sort(sortFn) : []

    if (sortDesc) {
      sorted.reverse()
    }

    if (!filter) {
      return sorted
    }

    let ranked = sorted.map(
      (item) => [item, rankItem(item.queryHash, filter)] as const,
    )

    ranked = ranked.filter((d) => d[1].passed)

    ranked = ranked.sort((a, b) => compareItems(a[1], b[1]))

    return ranked.map((d) => d[0])
  }, [sortDesc, sortFn, filter, queriesCount, queryCache])

  const [isMockOffline, setMockOffline] = React.useState(false)

  return (
    <ThemeProvider theme={theme}>
      <Panel
        ref={ref}
        className="ReactQueryDevtoolsPanel"
        aria-label="React Query Devtools Panel"
        id="ReactQueryDevtoolsPanel"
        {...panelProps}
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
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '4px',
            marginBottom: '-4px',
            cursor: 'row-resize',
            zIndex: 100000,
          }}
          onMouseDown={handleDragStart}
        ></div>
        <div
          style={{
            flex: '1 1 500px',
            minHeight: '40%',
            maxHeight: '100%',
            overflow: 'auto',
            borderRight: `1px solid ${theme.grayAlt}`,
            display: isOpen ? 'flex' : 'none',
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
            </button>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <QueryStatusCount queryCache={queryCache} />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
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
                    marginRight: '.5em',
                    width: '100%',
                  }}
                />
                {!filter ? (
                  <>
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
                      onClick={() => setSortDesc((old) => !old)}
                      style={{
                        padding: '.3em .4em',
                        marginRight: '.5em',
                      }}
                    >
                      {sortDesc ? '⬇ Desc' : '⬆ Asc'}
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
                    </Button>
                  </>
                ) : null}
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

        {activeQueryHash ? (
          <ActiveQuery
            activeQueryHash={activeQueryHash}
            queryCache={queryCache}
            queryClient={queryClient}
          />
        ) : null}
      </Panel>
    </ThemeProvider>
  )
})

const ActiveQuery = ({
  queryCache,
  activeQueryHash,
  queryClient,
}: {
  queryCache: QueryCache
  activeQueryHash: string
  queryClient: QueryClient
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

  if (!activeQuery || !activeQueryState) {
    return null
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
            alignItems: 'stretch',
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
              {JSON.stringify(activeQuery.queryKey, null, 2)}
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
        </Button>
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
    <QueryKeys style={{ marginBottom: '.5em' }}>
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

const QueryRow = ({
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
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop() {}
