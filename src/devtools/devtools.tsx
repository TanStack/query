// @ts-nocheck

import React from 'react'
import { matchSorter } from 'match-sorter'
import { useQueryClient } from '../react'
import useLocalStorage from './useLocalStorage'
import { useSafeState, isStale } from './utils'

import {
  Panel,
  QueryKeys,
  QueryKey,
  Button,
  Code,
  Input,
  Select,
  QueryCountStyles,
  ActiveQueryPanel,
} from './styledComponents'
import { ThemeProvider } from './theme'
import { getQueryStatusLabel, getQueryStatusColor } from './utils'
import Explorer from './Explorer'
import Logo from './Logo'

const isServer = typeof window === 'undefined'

const theme = {
  background: '#0b1521',
  backgroundAlt: '#132337',
  foreground: 'white',
  gray: '#3f4e60',
  grayAlt: '#222e3e',
  inputBackgroundColor: '#fff',
  inputTextColor: '#000',
  success: '#00ab52',
  danger: '#ff0085',
  active: '#006bff',
  warning: '#ffb200',
}

export function ReactQueryDevtools({
  initialIsOpen,
  panelProps = {},
  closeButtonProps = {},
  toggleButtonProps = {},
  position = 'bottom-left',
  containerElement: Container = 'footer',
}) {
  const rootRef = React.useRef()
  const panelRef = React.useRef()
  const [isOpen, setIsOpen] = useLocalStorage(
    'reactQueryDevtoolsOpen',
    initialIsOpen
  )
  const [isResolvedOpen, setIsResolvedOpen] = useSafeState(false)

  React.useEffect(() => {
    setIsResolvedOpen(isOpen)
  }, [isOpen, isResolvedOpen, setIsResolvedOpen])

  React[isServer ? 'useEffect' : 'useLayoutEffect'](() => {
    if (isResolvedOpen) {
      const previousValue = rootRef.current?.parentElement.style.paddingBottom

      const run = () => {
        const containerHeight = panelRef.current?.getBoundingClientRect().height
        rootRef.current.parentElement.style.paddingBottom = `${containerHeight}px`
      }

      run()

      window.addEventListener('resize', run)

      return () => {
        window.removeEventListener('resize', run)
        rootRef.current.parentElement.style.paddingBottom = previousValue
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

  return (
    <Container ref={rootRef} className="ReactQueryDevtools">
      {isResolvedOpen ? (
        <ThemeProvider theme={theme}>
          <ReactQueryDevtoolsPanel
            ref={panelRef}
            {...otherPanelProps}
            style={{
              position: 'fixed',
              bottom: '0',
              right: '0',
              zIndex: '99999',
              width: '100%',
              height: '500px',
              maxHeight: '90%',
              boxShadow: '0 0 20px rgba(0,0,0,.3)',
              borderTop: `1px solid ${theme.gray}`,
              ...panelStyle,
            }}
            setIsOpen={setIsOpen}
          />
          <Button
            {...otherCloseButtonProps}
            onClick={() => {
              setIsOpen(false)
              onCloseClick && onCloseClick()
            }}
            style={{
              position: 'fixed',
              zIndex: '99999',
              margin: '.5rem',
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
        </ThemeProvider>
      ) : (
        <button
          {...otherToggleButtonProps}
          aria-label="Open React Query Devtools"
          onClick={() => {
            setIsOpen(true)
            onToggleClick && onToggleClick()
          }}
          style={{
            background: 'none',
            border: 0,
            padding: 0,
            position: 'fixed',
            bottom: '0',
            right: '0',
            zIndex: '99999',
            display: 'inline-flex',
            fontSize: '1.5rem',
            margin: '.5rem',
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
      )}
    </Container>
  )
}

const getStatusRank = q =>
  q.state.isFetching ? 0 : !q.observers.length ? 3 : isStale(q) ? 2 : 1

const sortFns = {
  'Status > Last Updated': (a, b) =>
    getStatusRank(a) === getStatusRank(b)
      ? sortFns['Last Updated'](a, b)
      : getStatusRank(a) > getStatusRank(b)
      ? 1
      : -1,
  'Query Hash': (a, b) => (a.queryHash > b.queryHash ? 1 : -1),
  'Last Updated': (a, b) => (a.state.updatedAt < b.state.updatedAt ? 1 : -1),
}

export const ReactQueryDevtoolsPanel = React.forwardRef(
  function ReactQueryDevtoolsPanel(props, ref) {
    const { setIsOpen, ...panelProps } = props

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

    const [isDragging, setIsDragging] = useSafeState(false)

    const sortFn = React.useMemo(() => sortFns[sort], [sort])

    React[isServer ? 'useEffect' : 'useLayoutEffect'](() => {
      if (!sortFn) {
        setSort(Object.keys(sortFns)[0])
      }
    }, [setSort, sortFn])

    React[isServer ? 'useEffect' : 'useLayoutEffect'](() => {
      if (isDragging) {
        const run = e => {
          const containerHeight = window.innerHeight - e.pageY

          if (containerHeight < 70) {
            setIsOpen(false)
          } else {
            ref.current.style.height = `${containerHeight}px`
          }
        }
        document.addEventListener('mousemove', run)
        document.addEventListener('mouseup', handleDragEnd)

        return () => {
          document.removeEventListener('mousemove', run)
          document.removeEventListener('mouseup', handleDragEnd)
        }
      }
    }, [isDragging])

    const handleDragStart = e => {
      if (e.button !== 0) return // Only allow left click for drag
      setIsDragging(true)
    }

    const handleDragEnd = e => {
      setIsDragging(false)
    }

    const [unsortedQueries, setUnsortedQueries] = useSafeState(
      Object.values(queryCache.getAll())
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

      return matchSorter(sorted, filter, { keys: ['queryHash'] }).filter(
        d => d.queryHash
      )
    }, [sortDesc, sortFn, unsortedQueries, filter])

    const activeQuery = React.useMemo(() => {
      return queries.find(query => query.queryHash === activeQueryHash)
    }, [activeQueryHash, queries])

    const hasFresh = queries.filter(q => getQueryStatusLabel(q) === 'fresh')
      .length
    const hasFetching = queries.filter(
      q => getQueryStatusLabel(q) === 'fetching'
    ).length
    const hasStale = queries.filter(q => getQueryStatusLabel(q) === 'stale')
      .length
    const hasInactive = queries.filter(
      q => getQueryStatusLabel(q) === 'inactive'
    ).length

    React.useEffect(() => {
      return queryCache.subscribe(() => {
        setUnsortedQueries(Object.values(queryCache.getAll()))
      })
    }, [sort, sortFn, sortDesc, setUnsortedQueries, queryCache])

    return (
      <ThemeProvider theme={theme}>
        <Panel ref={ref} className="ReactQueryDevtoolsPanel" {...panelProps}>
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
            onMouseUp={handleDragEnd}
          ></div>
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
                padding: '.5rem',
                background: theme.backgroundAlt,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <QueryCountStyles>
                <div
                  style={{
                    fontWeight: 'bold',
                  }}
                >
                  Queries ({queries.length})
                </div>
              </QueryCountStyles>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <QueryKeys style={{ marginBottom: '.5rem' }}>
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
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Escape') setFilter('')
                    }}
                    style={{
                      flex: '1',
                      marginRight: '.5rem',
                    }}
                  />
                  <Select
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                    style={{
                      flex: '1',
                      minWidth: 75,
                      marginRight: '.5rem',
                    }}
                  >
                    {Object.keys(sortFns).map(key => (
                      <option key={key} value={key}>
                        Sort by {key}
                      </option>
                    ))}
                  </Select>
                  <Button
                    onClick={() => setSortDesc(old => !old)}
                    style={{
                      padding: '.2rem .4rem',
                    }}
                  >
                    {sortDesc ? '⬇ Desc' : '⬆ Asc'}
                  </Button>
                </div>
              </div>
            </div>
            <div
              style={{
                overflow: 'auto scroll',
              }}
            >
              {queries.map((query, i) => (
                <div
                  key={query.queryHash || i}
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
                      width: '2rem',
                      height: '2rem',
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
                    {query.observers.length}
                  </div>
                  <Code
                    style={{
                      padding: '.5rem',
                    }}
                  >
                    {`${query.queryHash}`}
                  </Code>
                </div>
              ))}
            </div>
          </div>
          {activeQuery ? (
            <ActiveQueryPanel>
              <div
                style={{
                  padding: '.5rem',
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
                  padding: '.5rem',
                }}
              >
                <div
                  style={{
                    marginBottom: '.5rem',
                    display: 'flex',
                    alignItems: 'stretch',
                    justifyContent: 'space-between',
                  }}
                >
                  <Code
                    style={{
                      lineHeight: '1.8rem',
                    }}
                  >
                    <pre
                      style={{
                        margin: 0,
                        padding: 0,
                      }}
                    >
                      {JSON.stringify(activeQuery.queryKey, null, 2)}
                    </pre>
                  </Code>
                  <span
                    style={{
                      padding: '0.3rem .6rem',
                      borderRadius: '0.4rem',
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
                    marginBottom: '.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  Observers: <Code>{activeQuery.observers.length}</Code>
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
                  padding: '.5rem',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                }}
              >
                Actions
              </div>
              <div
                style={{
                  padding: '0.5rem',
                }}
              >
                <Button
                  onClick={() => activeQuery.fetch()}
                  disabled={activeQuery.state.isFetching}
                  style={{
                    background: theme.active,
                  }}
                >
                  Refetch
                </Button>{' '}
                <Button
                  onClick={() => queryCache.remove(activeQuery)}
                  style={{
                    background: theme.danger,
                  }}
                >
                  Remove
                </Button>{' '}
              </div>
              <div
                style={{
                  background: theme.backgroundAlt,
                  padding: '.5rem',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                }}
              >
                Data Explorer
              </div>
              <div
                style={{
                  padding: '.5rem',
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
                  padding: '.5rem',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                }}
              >
                Query Explorer
              </div>
              <div
                style={{
                  padding: '.5rem',
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
  }
)
