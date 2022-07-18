import React from 'react'
import { useQueryClient, QueryCache } from 'react-query'
import { Action } from '../../core/query'

// TODO: Import from react-query
type QueryCacheNotifyEvent = NonNullable<
  Parameters<NonNullable<Parameters<QueryCache['subscribe']>[0]>>[0]
>

type ReactQueryBaseEvent = {
  receivedAt: Date
  queryHash: string
}

type ReactQueryObserverEvent = ReactQueryBaseEvent & {
  targetType: 'observer'
  eventType: 'observerAdded' | 'observerRemoved' | 'observerResultsUpdated'
}
export type ReactQueryQueryEvent = ReactQueryBaseEvent & {
  targetType: 'query'
  eventType: 'queryAdded' | 'queryRemoved' | 'queryUpdated'
  actionType: Action<any, any>['type'] | null
  cacheTime: number
  observersCount: number
}

function getEventTargetType(
  event: QueryCacheNotifyEvent
):
  | Omit<ReactQueryQueryEvent, keyof ReactQueryBaseEvent>
  | {
      targetType: 'observer'
      eventType: ReactQueryObserverEvent['eventType']
    } {
  if (event.type.startsWith('query')) {
    const actionType = event.type === 'queryUpdated' ? event.action.type : null
    return {
      targetType: 'query',
      eventType: event.type as 'queryAdded' | 'queryRemoved' | 'queryUpdated',
      actionType,
      cacheTime: event.query.cacheTime,
      observersCount: event.query.getObserversCount(),
    }
  }

  return {
    targetType: 'observer',
    eventType: event.type as
      | 'observerAdded'
      | 'observerRemoved'
      | 'observerResultsUpdated',
  }
}

type ReactQueryEvent = ReactQueryQueryEvent | ReactQueryObserverEvent

function createEvent(event: QueryCacheNotifyEvent): ReactQueryEvent {
  const eventTypes = getEventTargetType(event)
  return {
    ...eventTypes,
    receivedAt: new Date(),
    queryHash: event.query.queryHash,
  }
}

export type ReactQueryDevtoolsQueryEventGroup = {
  queryHash: string
  events: ReactQueryQueryEvent[]
  observers: ReactQueryObserverEvent[]
}

export default function useReactDevtoolsTimelineEvents() {
  const queryClient = useQueryClient()
  const queryCache = queryClient.getQueryCache()
  const [timeRange, setTimeRange] = React.useState<{
    start: Date | null
    end: Date | null
  }>({ start: new Date(), end: null })

  // TODO: switch to useSafeState
  const [events, setEvents] = React.useState<ReactQueryEvent[]>([])

  const isRecordingRef = React.useRef(true)

  const [inc, refresh] = React.useReducer(x => x + 1, 1)

  const queries = React.useMemo(() => {
    // TODO: force refresh for new date
    void inc
    const queriesMap: Record<string, ReactQueryDevtoolsQueryEventGroup> = {}
    events.forEach(e => {
      if (!(e.queryHash in queriesMap)) {
        queriesMap[e.queryHash] = {
          queryHash: e.queryHash,
          events: [],
          observers: [],
        }
      }
      const query = queriesMap[e.queryHash]!
      if (e.targetType === 'query') {
        query.events.push(e)
      }
      if (e.targetType === 'observer') {
        query.observers.push(e)
      }
    })

    return Object.values(queriesMap).map(query => {
      const queryEvents = query.events.sort(
        (a, b) => a.receivedAt.getTime() - b.receivedAt.getTime()
      )
      const startedAt =
        queryEvents[0]?.eventType === 'queryAdded'
          ? queryEvents[0].receivedAt
          : timeRange.start
      const lastEvent = queryEvents[queryEvents.length - 1]
      const endedAt =
        lastEvent?.eventType === 'queryRemoved'
          ? lastEvent.receivedAt
          : timeRange.end || new Date()

      return {
        ...query,
        events: queryEvents,
        startedAt,
        endedAt,
      }
    })
  }, [events, timeRange, inc])

  React.useEffect(() => {
    return queryCache.subscribe(result => {
      if (!isRecordingRef.current) return
      if (!result) return
      const event = createEvent(result)
      setEvents(prevEvents => [...prevEvents, event])
    })
  }, [queryCache])
  React.useEffect(() => {
    const timeout = window.setInterval(refresh, 1000)
    return () => window.clearInterval(timeout)
  }, [])

  return {
    startRecording: () => {
      isRecordingRef.current = true
      setTimeRange({ start: new Date(), end: null })
    },
    stopRecording: () => {
      isRecordingRef.current = false
      setTimeRange(({ start }) => ({ start, end: new Date() }))
    },
    reset: () => {
      isRecordingRef.current = false
      setTimeRange({ start: null, end: null })
      setEvents([])
    },
    // TODO Fix this
    isRecording: () => isRecordingRef.current,
    timeRange,
    queries,
  }
}
