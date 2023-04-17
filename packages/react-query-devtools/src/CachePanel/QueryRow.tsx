import React from 'react'
import type {
  QueryCache,
  QueryKey as QueryKeyType,
} from '@tanstack/react-query'

import { Code } from '../styledComponents'

import useSubscribeToQueryCache from '../useSubscribeToQueryCache'
import { getQueryStatusColor } from '../utils'
import { defaultTheme as theme } from '../theme'

interface QueryRowProps {
  queryKey: QueryKeyType
  setActiveQueryHash: (hash: string) => void
  activeQueryHash?: string
  queryCache: QueryCache
}

/**
 * Row for a query in the query list
 */
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
        () => queryCache.find({ queryKey })?.queryHash,
      ) ?? ''

    const queryState = useSubscribeToQueryCache(
      queryCache,
      () => queryCache.find({ queryKey })?.state,
    )

    const isStale =
      useSubscribeToQueryCache(queryCache, () =>
        queryCache.find({ queryKey })?.isStale(),
      ) ?? false

    const isDisabled =
      useSubscribeToQueryCache(queryCache, () =>
        queryCache.find({ queryKey })?.isDisabled(),
      ) ?? false

    const observerCount =
      useSubscribeToQueryCache(queryCache, () =>
        queryCache.find({ queryKey })?.getObserversCount(),
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

export default QueryRow
