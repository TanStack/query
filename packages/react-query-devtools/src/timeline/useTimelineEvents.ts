import React from 'react'
import {
  useQueryClient,
  QueryCache,
  Action,
  ContextOptions,
} from '@tanstack/react-query'

// TODO: Import from react-query
type QueryCacheNotifyEvent = NonNullable<
  Parameters<NonNullable<Parameters<QueryCache['subscribe']>[0]>>[0]
>

type ReactQueryBaseEvent = {
  receivedAt: Date
  queryHash: string
}

export type ReactQueryObserverEvent = ReactQueryBaseEvent & {
  targetType: 'observer'
  eventType: 'observerAdded' | 'observerRemoved' | 'observerResultsUpdated'
  observersCount: number
}
export type ReactQueryQueryEvent = ReactQueryBaseEvent & {
  targetType: 'query'
  eventType: 'added' | 'removed' | 'updated'
  actionType: Action<any, any>['type'] | null
  cacheTime: number
  observersCount: number
}

function getEventTargetType(
  event: QueryCacheNotifyEvent,
):
  | Omit<ReactQueryQueryEvent, keyof ReactQueryBaseEvent>
  | Omit<ReactQueryObserverEvent, keyof ReactQueryBaseEvent> {
  if (!event.type.startsWith('observer')) {
    const actionType = event.type === 'updated' ? event.action.type : null
    return {
      targetType: 'query',
      eventType: event.type as 'added' | 'removed' | 'updated',
      actionType,
      cacheTime: event.query.cacheTime,
      observersCount: event.query.getObserversCount(),
    }
  }

  return {
    targetType: 'observer',
    observersCount: event.query.getObserversCount(),
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

export default function useTimelineEvents(options: ContextOptions) {
  const { context } = options
  const queryClient = useQueryClient({ context })
  const queryCache = queryClient.getQueryCache()
  const [timeRange, setTimeRange] = React.useState<{
    start: Date | null
    end: Date | null
  }>({ start: new Date(), end: null })

  // TODO: switch to useSafeState
  const [events, setEvents] = React.useState<ReactQueryEvent[]>([])

  const [isRecording, setIsRecording] = React.useState(false)

  const [inc, refresh] = React.useReducer((x) => x + 1, 1)

  const queries = React.useMemo(() => {
    // TODO: force refresh for new date
    void inc
    const queriesMap: Record<string, ReactQueryDevtoolsQueryEventGroup> = {}
    events.forEach((e) => {
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

    return Object.values(queriesMap).map((query) => {
      const queryEvents = query.events.sort(
        (a, b) => a.receivedAt.getTime() - b.receivedAt.getTime(),
      )
      const startedAt =
        queryEvents[0]?.eventType === 'added'
          ? queryEvents[0].receivedAt
          : timeRange.start
      const lastEvent = queryEvents[queryEvents.length - 1]
      const endedAt =
        lastEvent?.eventType === 'removed'
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
    return queryCache.subscribe((result) => {
      if (!isRecording) return
      if (!result) return
      const event = createEvent(result)
      setEvents((prevEvents) => [...prevEvents, event])
    })
  }, [queryCache, isRecording])
  React.useEffect(() => {
    if (!isRecording) return
    const timeout = window.setInterval(refresh, 1000)
    return () => window.clearInterval(timeout)
  }, [isRecording])

  return {
    startRecording: () => {
      setIsRecording(true)
      setTimeRange({ start: new Date(), end: null })
    },
    stopRecording: () => {
      setIsRecording(false)
      setTimeRange(({ start }) => ({ start, end: new Date() }))
    },
    clear: () => {
      setIsRecording(false)
      setTimeRange({ start: null, end: null })
      setEvents([])
    },
    // TODO Fix this
    isRecording,
    timeRange,
    queries,
  }
}
