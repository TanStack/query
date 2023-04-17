import React from 'react'
import type { QueryCache, QueryClient } from '@tanstack/react-query'

import useSubscribeToQueryCache from '../useSubscribeToQueryCache'
import { Button, Code, Select, ActiveQueryPanel } from '../styledComponents'

import {
  getQueryStatusLabel,
  getQueryStatusColor,
  displayValue,
} from '../utils'
import Explorer from '../Explorer'
import type { DevToolsErrorType } from '../types'
import { defaultTheme as theme } from '../theme'

// eslint-disable-next-line @typescript-eslint/no-empty-function
function noop() {}

/**
 * Panel for the query currently being inspected
 *
 * It displays query details (key, observers...), query actions,
 * the data explorer and the query explorer
 */
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

  const currentErrorTypeName = React.useMemo(() => {
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
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      fetchMeta: {
        ...activeQuery.state.fetchMeta,
        __previousQueryOptions,
      } as any,
    })
  }

  const restoreQueryAfterLoadingOrError = () => {
    activeQuery.fetch(
      (activeQuery.state.fetchMeta as any).__previousQueryOptions,
      {
        // Make sure this fetch will cancel the previous one
        cancelRefetch: true,
      },
    )
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
                gcTime: -1,
              })
              activeQuery.setState({
                data: undefined,
                status: 'pending',
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                fetchMeta: {
                  ...activeQuery.state.fetchMeta,
                  __previousQueryOptions,
                } as any,
              })
            }
          }}
          style={{
            background: theme.paused,
          }}
        >
          {activeQuery.state.status === 'pending' ? 'Restore' : 'Trigger'}{' '}
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

ActiveQuery.displayName = 'ActiveQuery'

export default ActiveQuery
