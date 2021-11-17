import React from 'react'

import { Query, useQueryClient } from 'react-query'
import { matchSorter } from 'match-sorter'
import useLocalStorage from './useLocalStorage'
import { useIsMounted, useSafeState } from './utils'

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
import { noop } from '../core/utils'

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
}

interface DevtoolsPanelOptions {
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
            aria-label="Close React Query Devtools"
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

const getStatusRank = (q: Query) =>
  q.state.isFetching ? 0 : !q.getObserversCount() ? 3 : q.isStale() ? 2 : 1

const sortFns: Record<string, (a: Query, b: Query) => number> = {
  'Status > Last Updated': (a, b) =>
    getStatusRank(a) === getStatusRank(b)
      ? (sortFns['Last Updated']?.(a, b) as number)
      : getStatusRank(a) > getStatusRank(b)
      ? 1
      : -1,
  'Query Hash': (a, b) => (a.queryHash > b.queryHash ? 1 : -1),
  'Last Updated': (a, b) =>
    a.state.dataUpdatedAt < b.state.dataUpdatedAt ? 1 : -1,
}

export const ReactQueryDevtoolsPanel = React.forwardRef<
  HTMLDivElement,
  DevtoolsPanelOptions
>(function ReactQueryDevtoolsPanel(props, ref): React.ReactElement {
  const { isOpen = true, setIsOpen, handleDragStart, ...panelProps } = props

  const queryClient = useQueryClient()
  const queryCache = queryClient.getQueryCache()

  const [sort, setSort] = useLocalStorage(
    'reactQueryDevtoolsSortFn',
    Object.keys(sortFns)[0]
  )

  const [filter, setFilter] = useLocalStorage('reactQueryDevtoolsFilter', '')

  const [sortDesc, setSortDesc] = useLocalStorage(
    'reactQueryDevtoolsSortDesc',
    false
  )

  const sortFn = React.useMemo(() => sortFns[sort as string], [sort])

  React[isServer ? 'useEffect' : 'useLayoutEffect'](() => {
    if (!sortFn) {
      setSort(Object.keys(sortFns)[0] as string)
    }
  }, [setSort, sortFn])

  const [unsortedQueries, setUnsortedQueries] = useSafeState(
    Object.values(queryCache.findAll())
  )

  const [activeQueryHash, setActiveQueryHash] = useLocalStorage(
    'reactQueryDevtoolsActiveQueryHash',
    ''
  )

  const queries = React.useMemo(() => {
    const sorted = [...unsortedQueries].sort(sortFn)

    if (sortDesc) {
      sorted.reverse()
    }

    if (!filter) {
      return sorted
    }

    return matchSorter(sorted, filter, { keys: ['queryHash'] }).filter(
      d => d.queryHash
    )
  }, [sortDesc, sortFn, unsortedQueries, filter])

  const activeQuery = React.useMemo(() => {
    return queries.find(query => query.queryHash === activeQueryHash)
  }, [activeQueryHash, queries])

  const hasFresh = queries.filter(q => getQueryStatusLabel(q) === 'fresh')
    .length
  const hasFetching = queries.filter(q => getQueryStatusLabel(q) === 'fetching')
    .length
  const hasStale = queries.filter(q => getQueryStatusLabel(q) === 'stale')
    .length
  const hasInactive = queries.filter(q => getQueryStatusLabel(q) === 'inactive')
    .length

  React.useEffect(() => {
    if (isOpen) {
      const unsubscribe = queryCache.subscribe(() => {
        setUnsortedQueries(Object.values(queryCache.getAll()))
      })
      // re-subscribing after the panel is closed and re-opened won't trigger the callback,
      // So we'll manually populate our state
      setUnsortedQueries(Object.values(queryCache.getAll()))

      return unsubscribe
    }
    return undefined
  }, [isOpen, sort, sortFn, sortDesc, setUnsortedQueries, queryCache])

  const handleRefetch = () => {
    const promise = activeQuery?.fetch()
    promise?.catch(noop)
  }

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
            <Logo
              aria-hidden
              style={{
                marginRight: '.5em',
              }}
            />
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
              }}
            >
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
                  onChange={e => setFilter(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Escape') setFilter('')
                  }}
                  style={{
                    flex: '1',
                    marginRight: '.5em',
                  }}
                />
                {!filter ? (
                  <>
                    <Select
                      aria-label="Sort queries"
                      value={sort}
                      onChange={e => setSort(e.target.value)}
                      style={{
                        flex: '1',
                        minWidth: 75,
                        marginRight: '.5em',
                      }}
                    >
                      {Object.keys(sortFns).map(key => (
                        <option key={key} value={key}>
                          Sort by {key}
                        </option>
                      ))}
                    </Select>
                    <Button
                      type="button"
                      onClick={() => setSortDesc(old => !old)}
                      style={{
                        padding: '.3em .4em',
                      }}
                    >
                      {sortDesc ? '⬇ Desc' : '⬆ Asc'}
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
            {queries.map((query, i) => {
              const isDisabled =
                query.getObserversCount() > 0 && !query.isActive()
              return (
                <div
                  key={query.queryHash || i}
                  role="button"
                  aria-label={`Open query details for ${query.queryHash}`}
                  onClick={() =>
                    setActiveQueryHash(
                      activeQueryHash === query.queryHash ? '' : query.queryHash
                    )
                  }
                  style={{
                    display: 'flex',
                    borderBottom: `solid 1px ${theme.grayAlt}`,
                    cursor: 'pointer',
                    background:
                      query === activeQuery
                        ? 'rgba(255,255,255,.1)'
                        : undefined,
                  }}
                >
                  <div
                    style={{
                      flex: '0 0 auto',
                      width: '2em',
                      height: '2em',
                      background: getQueryStatusColor(query, theme),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      textShadow:
                        getQueryStatusLabel(query) === 'stale'
                          ? '0'
                          : '0 0 10px black',
                      color:
                        getQueryStatusLabel(query) === 'stale'
                          ? 'black'
                          : 'white',
                    }}
                  >
                    {query.getObserversCount()}
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
                    {`${query.queryHash}`}
                  </Code>
                </div>
              )
            })}
          </div>
        </div>

        {activeQuery ? (
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
                    background: getQueryStatusColor(activeQuery, theme),
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
                Observers: <Code>{activeQuery.getObserversCount()}</Code>
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
                  {new Date(
                    activeQuery.state.dataUpdatedAt
                  ).toLocaleTimeString()}
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
                disabled={activeQuery.state.isFetching}
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
                value={activeQuery?.state?.data}
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
        ) : null}
      </Panel>
    </ThemeProvider>
  )
})
