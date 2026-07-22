import { createSignal, onCleanup } from 'solid-js'
import type {
  MutationCache,
  MutationCacheNotifyEvent,
  QueryCache,
  QueryCacheNotifyEvent,
} from '@tanstack/query-core'
import type { TimelineSpan } from './types'

const MAX_SPANS = 200

let spanIdCounter = 0
const nextSpanId = () => `span-${++spanIdCounter}`

const [spans, setSpans] = createSignal<Array<TimelineSpan>>([], {
  equals: false,
})

/** Most recent open span id per queryHash / mutationId */
const openQuerySpans = new Map<string, Array<string>>()
const openMutationSpans = new Map<number, Array<string>>()

export const getSpans = () => spans()

export const clearTimeline = () => {
  openQuerySpans.clear()
  openMutationSpans.clear()
  setSpans([])
}

/** Reset store state — used by tests */
export const resetTimelineStore = () => {
  spanIdCounter = 0
  clearTimeline()
}

const pushSpan = (span: TimelineSpan) => {
  setSpans((prev) => {
    const next = [...prev, span]
    if (next.length <= MAX_SPANS) return next

    const overflow = next.length - MAX_SPANS
    const trimmed = next.slice(overflow)
    // Drop open-span bookkeeping for removed spans
    for (let i = 0; i < overflow; i++) {
      const removed = next[i]
      if (!removed) continue
      if (removed.queryHash) {
        const stack = openQuerySpans.get(removed.queryHash)
        if (stack) {
          const filtered = stack.filter((id) => id !== removed.id)
          if (filtered.length) openQuerySpans.set(removed.queryHash, filtered)
          else openQuerySpans.delete(removed.queryHash)
        }
      }
      if (removed.mutationId !== undefined) {
        const stack = openMutationSpans.get(removed.mutationId)
        if (stack) {
          const filtered = stack.filter((id) => id !== removed.id)
          if (filtered.length)
            openMutationSpans.set(removed.mutationId, filtered)
          else openMutationSpans.delete(removed.mutationId)
        }
      }
    }
    return trimmed
  })
}

const updateSpanById = (
  id: string,
  updater: (span: TimelineSpan) => TimelineSpan,
) => {
  setSpans((prev) => {
    const index = prev.findIndex((s) => s.id === id)
    if (index === -1) return prev
    const current = prev[index]
    if (!current) return prev
    const next = prev.slice()
    next[index] = updater(current)
    return next
  })
}

const closeSpan = (id: string, status: 'success' | 'error', endedAt: number) => {
  updateSpanById(id, (span) => ({
    ...span,
    status,
    endedAt,
    durationMs: Math.max(0, endedAt - span.startedAt),
  }))
}

const popOpenSpan = <TKey,>(
  map: Map<TKey, Array<string>>,
  key: TKey,
): string | undefined => {
  const stack = map.get(key)
  if (!stack || stack.length === 0) return undefined
  const id = stack.pop()
  if (!stack.length) map.delete(key)
  else map.set(key, stack)
  return id
}

const peekOpenSpan = <TKey,>(
  map: Map<TKey, Array<string>>,
  key: TKey,
): string | undefined => {
  const stack = map.get(key)
  return stack?.[stack.length - 1]
}

const pushOpenSpan = <TKey,>(
  map: Map<TKey, Array<string>>,
  key: TKey,
  id: string,
) => {
  const stack = map.get(key)
  if (stack) stack.push(id)
  else map.set(key, [id])
}

export const handleQueryCacheEvent = (event: QueryCacheNotifyEvent) => {
  if (event.type !== 'updated') return

  const { query, action } = event
  const now = Date.now()
  const queryHash = query.queryHash

  switch (action.type) {
    case 'fetch': {
      const id = nextSpanId()
      pushOpenSpan(openQuerySpans, queryHash, id)
      pushSpan({
        id,
        kind: 'query',
        keyLabel: queryHash,
        queryHash,
        status: 'pending',
        startedAt: now,
      })
      break
    }
    case 'success': {
      const id = popOpenSpan(openQuerySpans, queryHash)
      if (id) closeSpan(id, 'success', now)
      break
    }
    case 'error': {
      const id = popOpenSpan(openQuerySpans, queryHash)
      if (id) closeSpan(id, 'error', now)
      break
    }
    case 'pause': {
      const id = peekOpenSpan(openQuerySpans, queryHash)
      if (id) updateSpanById(id, (span) => ({ ...span, status: 'paused' }))
      break
    }
    case 'continue': {
      const id = peekOpenSpan(openQuerySpans, queryHash)
      if (id) updateSpanById(id, (span) => ({ ...span, status: 'pending' }))
      break
    }
    default:
      break
  }
}

export const handleMutationCacheEvent = (event: MutationCacheNotifyEvent) => {
  if (event.type !== 'updated') return

  const { mutation, action } = event
  const now = Date.now()
  const mutationId = mutation.mutationId
  const keyLabel = mutation.options.mutationKey
    ? JSON.stringify(mutation.options.mutationKey)
    : `Mutation #${mutationId}`

  switch (action.type) {
    case 'pending': {
      const id = nextSpanId()
      pushOpenSpan(openMutationSpans, mutationId, id)
      pushSpan({
        id,
        kind: 'mutation',
        keyLabel,
        mutationId,
        status: 'pending',
        startedAt: mutation.state.submittedAt || now,
      })
      break
    }
    case 'success': {
      const id = popOpenSpan(openMutationSpans, mutationId)
      if (id) closeSpan(id, 'success', now)
      break
    }
    case 'error': {
      const id = popOpenSpan(openMutationSpans, mutationId)
      if (id) closeSpan(id, 'error', now)
      break
    }
    case 'pause': {
      const id = peekOpenSpan(openMutationSpans, mutationId)
      if (id) updateSpanById(id, (span) => ({ ...span, status: 'paused' }))
      break
    }
    case 'continue': {
      const id = peekOpenSpan(openMutationSpans, mutationId)
      if (id) updateSpanById(id, (span) => ({ ...span, status: 'pending' }))
      break
    }
    default:
      break
  }
}

export const setupTimelineSubscriptions = (
  queryCache: QueryCache,
  mutationCache: MutationCache,
) => {
  const unsubscribeQuery = queryCache.subscribe(handleQueryCacheEvent)
  const unsubscribeMutation = mutationCache.subscribe(handleMutationCacheEvent)

  onCleanup(() => {
    unsubscribeQuery()
    unsubscribeMutation()
  })

  return () => {
    unsubscribeQuery()
    unsubscribeMutation()
  }
}

export const useTimelineSpans = () => spans

export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)}s`
  const minutes = Math.floor(ms / 60_000)
  const seconds = ((ms % 60_000) / 1000).toFixed(0)
  return `${minutes}m ${seconds}s`
}
