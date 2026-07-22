export type TimelineSpanKind = 'query' | 'mutation'

export type TimelineSpanStatus = 'pending' | 'success' | 'error' | 'paused'

export type TimelineSpan = {
  id: string
  kind: TimelineSpanKind
  keyLabel: string
  queryHash?: string
  mutationId?: number
  status: TimelineSpanStatus
  startedAt: number
  endedAt?: number
  durationMs?: number
}

export type TimelineFilter = 'all' | 'query' | 'mutation'
