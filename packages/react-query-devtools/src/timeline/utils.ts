import {
  ReactQueryDevtoolsQueryEventGroup,
  ReactQueryObserverEvent,
  ReactQueryQueryEvent,
} from './useTimelineEvents'

type ActionType = NonNullable<ReactQueryQueryEvent['actionType']>

export type Box = {
  startAt: Date
  endAt: Date
  updates: { at: Date; action: ActionType | null }[]
  cacheTime?: number
  observers: ReactQueryObserverEvent[]
}

function createBox(box: Partial<Box>) {
  return {
    observers: [],
    updates: [],
    ...box,
  }
}

export function computeQueryBoxes(
  query: ReactQueryDevtoolsQueryEventGroup,
  timeRange: {
    start: Date
    end: Date | null
  },
) {
  const { observers, events } = query
  const sortedEvents = events.sort(
    (a, b) => a.receivedAt.getTime() - b.receivedAt.getTime(),
  )
  const items: Box[] = []
  let partial: Partial<Box> = {}
  sortedEvents.forEach((event) => {
    console.log(event.queryHash, event.cacheTime)
    if (event.eventType === 'added') {
      partial.startAt = event.receivedAt
    } else if (event.eventType === 'removed') {
      items.push({
        ...createBox(partial),
        endAt: event.receivedAt,
        startAt: partial.startAt ?? timeRange.start,
        cacheTime: event.cacheTime,
      })
      partial = {}
    } else {
      partial.startAt ??= timeRange.start
      if (!partial.updates) {
        partial.updates = []
      }
      partial.updates.push({
        at: event.receivedAt,
        action: event.actionType,
      })
    }
  })
  if (partial.startAt) {
    items.push({
      ...createBox(partial),
      startAt: partial.startAt,
      endAt: timeRange.end || new Date(),
    })
    partial = {}
  }
  if (partial.endAt) {
    items.push({
      ...createBox(partial),
      startAt: timeRange.start,
      endAt: partial.endAt,
    })
  }
  return items.map((item) => ({
    ...item,
    observers: observers.filter(
      (observer) =>
        observer.receivedAt >= item.startAt &&
        observer.receivedAt <= item.endAt,
    ),
  }))
}

export function computeObserverCountBoxes(query: Box) {
  const { observers: observerEvents = [] } = query
  const events = observerEvents.filter(
    (ob) => ob.eventType !== 'observerResultsUpdated',
  )

  const counts = []
  for (let i = 0; i < events.length; i++) {
    const event = events[i] as ReactQueryObserverEvent

    const end = i < events.length - 1 ? events[i + 1]!.receivedAt : query.endAt
    counts.push({
      start: event.receivedAt,
      end,
      count: event.observersCount,
    })
  }

  return counts.filter((c) => c.count !== 0)
}
