import {
  focusManager,
  isServer,
  isValidTimeout,
  timeoutManager,
} from '@tanstack/query-core/primitives'
import { resolveQueryValue } from './utils'
import type { QueryKey } from '@tanstack/query-core'
import type { Query } from './query'

interface PollingTimer {
  query: object
  delay: number
  stop: () => void
}

interface PollingObserver<TQuery> {
  getCurrentQuery: () => TQuery
  hasListeners: () => boolean
  options: {
    enabled?: boolean | ((query: TQuery) => boolean)
    refetchIntervalInBackground?: boolean
  }
}

type Delay = number | false | undefined

/** An observer option created by {@link refetchInterval}. */
interface RefetchInterval<TQuery> {
  value: Delay | ((query: TQuery) => Delay)
  update: typeof updatePolling
}

/**
 * Polls an observed query after the specified delay in milliseconds.
 * @param value - A delay or a callback that selects the delay for the current query.
 * Returning zero, false or undefined stops the timer.
 * @returns A polling option for a query hook or client defaults.
 * @example
 * ```ts
 * useQuery({ queryKey: ['orders'], queryFn: fetchOrders, refetchInterval: refetchInterval(3000) })
 * ```
 */
export function refetchInterval(value: Delay): RefetchInterval<object>
export function refetchInterval<TQuery extends object>(
  value: Delay | ((query: TQuery) => Delay),
): RefetchInterval<TQuery>
/* #__NO_SIDE_EFFECTS__ */
export function refetchInterval<TQuery extends object>(
  value: Delay | ((query: TQuery) => Delay),
): RefetchInterval<TQuery> {
  return { value, update: updatePolling }
}

/**
 * Reconciles one observer's timer with its current options and cached query.
 * @param observer - Observer receiving the optional schedule.
 * @param current - Timer installed during the preceding update.
 * @param restart - Restarts the countdown after a query update or subscription.
 * @param fetch - Refetches the observer's current query.
 * @returns The active timer and its cleanup, when polling is enabled.
 */
function updatePolling<TQueryFnData, TError, TData, TQueryKey extends QueryKey>(
  this: RefetchInterval<Query<TQueryFnData, TError, TData, TQueryKey>>,
  observer: PollingObserver<Query<TQueryFnData, TError, TData, TQueryKey>>,
  current: PollingTimer | undefined,
  restart: boolean,
  fetch: () => void,
): PollingTimer | undefined {
  const query = observer.getCurrentQuery()
  const delay = resolveQueryValue(this.value, query)
  if (!observer.hasListeners()) return

  if (
    isServer() ||
    !isValidTimeout(delay) ||
    delay === 0 ||
    resolveQueryValue(observer.options.enabled, query) === false
  ) {
    current?.stop()
    return
  }
  if (!restart && current?.query === query && current.delay === delay) {
    return current
  }
  current?.stop()
  const id = timeoutManager.setInterval(() => {
    if (
      observer.options.refetchIntervalInBackground ||
      focusManager.isFocused()
    ) {
      fetch()
    }
  }, delay)

  return { query, delay, stop: () => timeoutManager.clearInterval(id) }
}

export type { PollingTimer, RefetchInterval }
