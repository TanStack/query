import * as React from 'react'

import {
  useQueryClient,
  onlineManager,
  QueryCache,
  QueryClient,
  QueryKey as QueryKeyType,
  ContextOptions,
} from '@tanstack/react-query'
import { rankItem, compareItems } from '@tanstack/match-sorter-utils'
import useLocalStorage from './useLocalStorage'
import { sortFns, useSubscribeToQueryCache } from './utils'

import {
  QueryKeys,
  QueryKey,
  Button,
  Code,
  Input,
  Select,
  ActiveQueryPanel,
} from './styledComponents'
import { defaultTheme as theme } from './theme'
import { getQueryStatusLabel, getQueryStatusColor } from './utils'
import Explorer from './Explorer'
import { PanelHead, PanelMain } from './panelComponents'

interface CachePanelProps extends ContextOptions {
  /**
   * A boolean variable indicating whether the panel is open or closed
   */
  isOpen?: boolean
  /**
   * A function that toggles the open and close state of the panel
   */
  setIsOpen: (isOpen: boolean) => void
}

export function CachePanel(props: CachePanelProps) {
  const { isOpen = true, setIsOpen, context } = props

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
    <>
      <PanelMain isOpen={isOpen}>
        <PanelHead setIsOpen={setIsOpen}>
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
        </PanelHead>
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
      </PanelMain>

      {activeQueryHash ? (
        <ActiveQuery
          activeQueryHash={activeQueryHash}
          queryCache={queryCache}
          queryClient={queryClient}
        />
      ) : null}
    </>
  )
}

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

export default CachePanel
